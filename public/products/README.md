# Product Images

Add your product images to the respective folders:

- `youth/` - Images for Xperience Youth (Volumex Liquid)
- `roman/` - Images for Roman Xperience

## Supported Formats
- `.jpg` / `.jpeg`
- `.png`
- `.webp`
- `.gif`

## How It Works
1. Add your images to the appropriate folder (`youth/` or `roman/`)
2. Images will be automatically detected and displayed
3. If multiple images are added, users can scroll through them using arrow buttons or dots
4. Images are sorted alphabetically by filename
5. If no images are found, a gradient placeholder will be shown

## Example Structure
```
public/
  products/
    youth/
      1.jpg
      2.jpg
      product-front.png
    roman/
      main.jpg
      detail.jpg
      back.png
```

The component will automatically load all images from these folders and create a scrollable gallery if multiple images are present.

