// app/api/plugins/route.ts
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const manifestsDir = path.join(process.cwd(), 'manifests');
        const files = await fs.promises.readdir(manifestsDir);
        const manifests = await Promise.all(
            files.filter(f => f.endsWith('.json')).map(async (f) => {
                const text = await fs.promises.readFile(path.join(manifestsDir, f), 'utf-8');
                return JSON.parse(text);
            })
        );
        return NextResponse.json({ ok: true, data: manifests });
    } catch (err) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}
