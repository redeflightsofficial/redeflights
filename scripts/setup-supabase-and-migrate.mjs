import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { readFile as readFileAsync } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const publicDir = path.join(root, "public");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) return {};
  const lines = readFileSync(envPath, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).replace(/^["']|["']$/g, "");
  }
  return env;
}

function getProjectRef(url) {
  const match = String(url || "").match(/https?:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] || "";
}

async function runSchemaSql(env) {
  const dbUrl = env.DATABASE_URL;
  const password = env.SUPABASE_DB_PASSWORD;
  const projectRef = getProjectRef(env.NEXT_PUBLIC_SUPABASE_URL);

  if (!dbUrl && !password) {
    console.log("Schema setup skipped: add SUPABASE_DB_PASSWORD or DATABASE_URL to .env.local");
    return false;
  }

  let connectionString = dbUrl;
  if (!connectionString) {
    connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;
  }

  const sqlPath = path.join(root, "supabase", "all-tables.sql");
  const sql = readFileSync(sqlPath, "utf8");

  let pg;
  try {
    pg = await import("pg");
  } catch {
    console.error("Install pg first: npm install --save-dev pg");
    process.exit(1);
  }

  const client = new pg.default.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Schema setup: all tables/policies applied");
    return true;
  } finally {
    await client.end();
  }
}

function readJson(name) {
  const filePath = path.join(dataDir, `${name}.local.json`);
  if (!existsSync(filePath)) return [];
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function fixUrls(value, siteOrigin) {
  if (typeof value !== "string") return value;
  return value
    .replace(/https?:\/\/localhost:\d+/g, siteOrigin)
    .replace(/https?:\/\/127\.0\.0\.1:\d+/g, siteOrigin);
}

function fixRecordUrls(record, siteOrigin) {
  const next = { ...record };
  for (const key of Object.keys(next)) {
    if (typeof next[key] === "string") {
      next[key] = fixUrls(next[key], siteOrigin);
    }
  }
  if (typeof next.page_url === "string" && next.page_url.startsWith("/")) {
    next.page_url = `${siteOrigin}${next.page_url}`;
  }
  if (typeof next.image_url === "string" && next.image_url.startsWith("/")) {
    next.image_url = `${siteOrigin}${next.image_url}`;
  }
  return next;
}

async function upsertBatch(supabase, table, rows, label) {
  if (!rows.length) {
    console.log(`- ${label}: skipped (0 local records)`);
    return { inserted: 0, errors: [] };
  }

  const errors = [];
  let inserted = 0;

  for (const row of rows) {
    const { data: existing } = await supabase.from(table).select("id").eq("id", row.id).maybeSingle();
    if (existing) {
      const { error } = await supabase.from(table).update(row).eq("id", row.id);
      if (error) errors.push({ id: row.id, message: error.message });
      else inserted += 1;
      continue;
    }

    const { error } = await supabase.from(table).insert(row);
    if (error) {
      if (/duplicate key|already exists/i.test(error.message)) {
        const { error: updateError } = await supabase.from(table).update(row).eq("slug", row.slug);
        if (updateError) errors.push({ id: row.id, message: updateError.message });
        else inserted += 1;
      } else {
        errors.push({ id: row.id, message: error.message });
      }
    } else {
      inserted += 1;
    }
  }

  console.log(`- ${label}: ${inserted}/${rows.length} synced`);
  if (errors.length) {
    console.log(`  errors (${errors.length}):`);
    for (const item of errors.slice(0, 5)) {
      console.log(`    ${item.id}: ${item.message}`);
    }
  }

  return { inserted, errors };
}

async function uploadStorageFiles(supabase, items, bucket, resolveLocalPath) {
  let uploaded = 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");

  for (const item of items) {
    const localPath = resolveLocalPath(item);
    if (!localPath || !existsSync(localPath)) {
      console.log(`  ! file missing: ${item.storage_path || item.slug}`);
      continue;
    }

    const storagePath = item.storage_path;
    const buffer = await readFileAsync(localPath);
    const contentType = localPath.endsWith(".png")
      ? "image/png"
      : localPath.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";

    const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.log(`  ! storage upload failed for ${storagePath}: ${error.message}`);
      continue;
    }

    if (supabaseUrl && item.id) {
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
      await supabase.from(bucket === "banners" ? "banners" : "visas").update({ image_url: imageUrl }).eq("id", item.id);
    }

    uploaded += 1;
  }

  console.log(`- ${bucket} images uploaded: ${uploaded}/${items.length}`);
}

async function deriveAirportsFromRoutes(routes, siteOrigin) {
  const map = new Map();

  for (const route of routes) {
    const pairs = [
      { code: route.from_airport_code, city: route.from_city },
      { code: route.to_airport_code, city: route.to_city },
    ];

    for (const pair of pairs) {
      const code = String(pair.code || "").trim().toUpperCase();
      const city = String(pair.city || "").trim();
      if (!code || code.length !== 3 || !city || map.has(code)) continue;

      const slug = `${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${code.toLowerCase()}-airport`;
      map.set(code, {
        name: `${city} Airport`,
        iata_code: code,
        city,
        country: null,
        slug,
        seo_title: `${city} (${code}) Airport | REDE FLIGHTS`,
        meta_description: `Find flights via ${city} (${code}) airport with REDE FLIGHTS.`,
        h1_heading: `${city} Airport (${code})`,
        page_url: `${siteOrigin}/airports/${slug}`,
        status: "active",
      });
    }
  }

  return [...map.values()];
}

async function main() {
  const env = loadEnv();
  process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteOrigin = (env.NEXT_PUBLIC_SITE_URL || "https://rede-i-flights.vercel.app").replace(/\/$/, "");

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or API key in .env.local");
    process.exit(1);
  }

  console.log("Step 1: Supabase schema setup");
  await runSchemaSql(env);

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("\nStep 2: Migrate local admin data");
  console.log(`Site origin: ${siteOrigin}`);
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("Note: SUPABASE_SERVICE_ROLE_KEY missing — storage uploads may fail (RLS).");
  }

  const routes = readJson("routes").map((row) => fixRecordUrls(row, siteOrigin));
  const hotels = readJson("hotels").map((row) => fixRecordUrls(row, siteOrigin));
  const banners = readJson("banners").map((row) => fixRecordUrls(row, siteOrigin));
  const visas = readJson("visas").map((row) => {
    const fixed = fixRecordUrls(row, siteOrigin);
    return { ...fixed, visa_type: fixed.visa_type || "Tourist" };
  });
  const airlines = readJson("airlines").map((row) => fixRecordUrls(row, siteOrigin));
  const airports = readJson("airports").map((row) => fixRecordUrls(row, siteOrigin));
  const destinations = readJson("destinations").map((row) => fixRecordUrls(row, siteOrigin));
  const derivedAirports = await deriveAirportsFromRoutes(routes, siteOrigin);

  await upsertBatch(supabase, "routes", routes, "routes");
  await upsertBatch(supabase, "hotels", hotels, "hotels");
  await upsertBatch(supabase, "banners", banners, "banners");
  await upsertBatch(supabase, "visas", visas, "visas");
  await upsertBatch(supabase, "airlines", airlines, "airlines");
  await upsertBatch(supabase, "airports", airports, "airports");
  await upsertBatch(supabase, "destinations", destinations, "destinations");

  if (derivedAirports.length) {
    for (const airport of derivedAirports) {
      const { data: existing } = await supabase
        .from("airports")
        .select("id")
        .eq("iata_code", airport.iata_code)
        .maybeSingle();
      if (existing) continue;
      const { error } = await supabase.from("airports").insert(airport);
      if (error) console.log(`  ! derived airport ${airport.iata_code}: ${error.message}`);
    }
    console.log(`- derived airports from routes: ${derivedAirports.length} checked`);
  }

  if (banners.length) {
    await uploadStorageFiles(supabase, banners, "banners", (banner) =>
      path.join(publicDir, banner.storage_path),
    );
  }

  if (visas.length) {
    await uploadStorageFiles(supabase, visas, "visas", (visa) => {
      const rel = String(visa.storage_path || "").replace(/^uploads\/visas\//, "");
      return path.join(publicDir, "uploads", "visas", rel);
    });
  }

  for (const table of ["routes", "hotels", "banners", "visas", "airports"]) {
    const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
    console.log(`  ${table}: ${count ?? "?"}`);
  }

  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Setup/migration failed:", error);
  process.exit(1);
});
