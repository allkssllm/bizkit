param([string]$Path, [string]$OutPath)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
$entry = $zip.GetEntry('word/document.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xml = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()

$xmlDoc = New-Object System.Xml.XmlDocument
$xmlDoc.LoadXml($xml)
$nsmgr = New-Object System.Xml.XmlNamespaceManager($xmlDoc.NameTable)
$nsmgr.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')

$paragraphs = $xmlDoc.SelectNodes('//w:p', $nsmgr)
$fullText = ""
foreach ($p in $paragraphs) {
    $text = ''
    $texts = $p.SelectNodes('.//w:t', $nsmgr)
    foreach ($t in $texts) {
        $text += $t.InnerText
    }
    if ($text -ne '') {
        $fullText += $text + "`r`n"
    }
}
[System.IO.File]::WriteAllText($OutPath, $fullText)
