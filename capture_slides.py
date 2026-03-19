#!/usr/bin/env python3
"""
capture_slides.py
Capture each slide of presentation.html as a PNG image using Playwright.
"""

import asyncio
import os
from pathlib import Path

async def capture_slides():
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("Playwright not installed. Installing...")
        os.system("pip install playwright")
        os.system("python -m playwright install chromium")
        from playwright.async_api import async_playwright

    html_path = Path(__file__).parent / "presentation.html"
    output_dir = Path(__file__).parent / "slides_images"
    output_dir.mkdir(exist_ok=True)

    file_url = html_path.resolve().as_uri()
    print(f"Opening: {file_url}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720}
        )
        page = await context.new_page()

        # Load the page
        await page.goto(file_url, wait_until="networkidle")
        await asyncio.sleep(2)  # Wait for fonts / animations

        # Get total slide count
        total = await page.evaluate("() => document.querySelectorAll('.slide').length")
        print(f"Total slides: {total}")

        for i in range(total):
            # Navigate to slide i
            await page.evaluate(f"() => goTo({i})")
            await asyncio.sleep(0.8)  # Wait for transition

            # Screenshot
            out_path = output_dir / f"slide_{i+1:02d}.png"
            await page.screenshot(path=str(out_path), full_page=False)
            print(f"  Saved: {out_path}")

        await browser.close()
        print(f"\nDone! {total} slides saved to: {output_dir}")

if __name__ == "__main__":
    asyncio.run(capture_slides())
