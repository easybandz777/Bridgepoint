# Gallery photos

Add your project photos here so they appear on the **Gallery** page.

## How to add photos from Google Photos (recommended)

1. Open your Google Photos album in the browser and sign in.
2. Select all photos (checkbox on first photo, then "Select all" at top), or select the ones you want.
3. Click the **three-dot menu** (top right) → **Download**. Google will create a zip or a folder of images.
4. Unzip if you got a zip, and note the folder path (e.g. `C:\Users\You\Downloads\BATHROOMS`).
5. From the **project root** (`c:\bridgepoint`), run:
   ```bash
   npm run gallery:import -- "C:\Users\You\Downloads\BATHROOMS" bathrooms
   ```
   Use the actual path to your downloaded folder. The second argument is the category: `bathrooms`, `kitchens`, `painting`, `full-remodel`, or `custom`.
6. Restart or refresh the dev server and open the **Gallery** page.

**Example (PowerShell):**
```powershell
cd c:\bridgepoint
npm run gallery:import -- "C:\Users\hones\Downloads\BATHROOMS" bathrooms
```

## Manual add

You can also drop image files directly into the correct folder below. No code changes needed.

## Folder structure

| Folder        | Use for                          | Shown as    |
|---------------|-----------------------------------|-------------|
| `bathrooms/`  | Bathroom remodels and finishes   | Bathrooms   |
| `kitchens/`   | Kitchen remodels and cabinetry   | Kitchens    |
| `painting/`   | Interior, exterior, cabinet paint| Painting    |
| `flooring/`   | Flooring, tile, hardwood         | Flooring    |
| `full-remodel/` | Whole-home remodels           | Full Remodel|
| `custom/`     | Custom carpentry, libraries, etc. | Custom      |

## Rules

- **Formats:** `.jpg`, `.jpeg`, `.png`, `.webp`
- **Names:** Any filename (e.g. `01.jpg`, `master-bath-tile.jpg`). Files are sorted by name.
- **Size:** Prefer 1200px–2000px on the long side for fast loading and good quality.

After adding or removing files, refresh the Gallery page to see changes.

## Remove irrelevant images

To delete specific photos (e.g. mistaken or off-topic images):

1. Open the **Gallery** page and find the image to remove. Note its filename from the browser (e.g. in the image URL: `.../bathrooms/15.jpg` means the file is `15.jpg`).
2. From the project root run:
   ```bash
   node scripts/remove-gallery-images.js bathrooms 15.jpg
   ```
   You can list multiple files: `node scripts/remove-gallery-images.js bathrooms 07.jpg 15.jpg`.

To list **portrait** images in a category (often useful to spot non-bathroom photos):
   ```bash
   node scripts/remove-gallery-images.js bathrooms --list-portrait
   ```
