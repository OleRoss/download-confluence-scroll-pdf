# Export confluence scroll pdf action

This action exports a confluence page and downloads it using scroll pdf. It ouputs the path of the resuling pdf.

## Inputs

### `page`
**Required** Id of the page to be exported. Default `"World"`.
### `scope`
**template** The scope of the action. Default `"descendants"`.
### `template`
**Required** Id of the scroll pdf template. Default `"com.k15t.scroll.pdf.default-template-documentation"`.

## Outputs

### `path`
Path to the created pdf file

## Example usage

```yaml
on: [push]

jobs:
  export_pdf_job:
    runs-on: ubuntu-latest
    steps:
      - name: Export confluence pdf
        id: pdf-export
        uses: VakuWare/download-confluence-scroll-pdf@v1
        with:
          page: '134185461'
          scope: 'descendants'
          template: 'com.k15t.scroll.pdf.default-template-documentation'
      - name: Get the output time
        run: echo "You can find the file at ${{ steps.pdf-export.outputs.path }}"
```
