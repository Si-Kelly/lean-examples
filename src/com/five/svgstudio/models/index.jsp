<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script type="module" src="../model-editor.js"></script>
    <script type="module" src="../layout.js"></script>
    <script type="module" src="../browser.js"></script>
    <link rel="stylesheet" href="../../style.css">

    <title>Model editor</title>
</head>

<body>
    <five-studio-layout>
        <div slot="page-title">Model editor</div>
        <div slot="content">
            <model-editor model-key="${resource}"></model-editor>
            <div class="browser">
                <asset-browser asset-path="../actions" asset-type="actions" asset-key="${resource}" asset-title="Actions"></asset-browser>
            </div>
        </div>
    </five-studio-layout>
</body>

</html>