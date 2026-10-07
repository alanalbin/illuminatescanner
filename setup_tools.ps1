$ProgressPreference = 'SilentlyContinue'
$zipUrl = 'https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.zip'
$outZip = Join-Path $PSScriptRoot 'maven.zip'
$toolsDir = Join-Path $PSScriptRoot '.tools'

if (-not (Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
}

$mvnExe = Join-Path $toolsDir 'apache-maven-3.9.9\bin\mvn.cmd'
if (-not (Test-Path $mvnExe)) {
    Write-Output "Downloading Maven from $zipUrl..."
    Invoke-WebRequest -Uri $zipUrl -OutFile $outZip -UseBasicParsing
    Write-Output "Extracting Maven..."
    Expand-Archive -Path $outZip -DestinationPath $toolsDir -Force
    if (Test-Path $outZip) {
        Remove-Item $outZip -Force
    }
}

if (Test-Path $mvnExe) {
    Write-Output "Maven installed successfully at: $mvnExe"
    & $mvnExe -version
} else {
    Write-Error "Maven installation failed"
}
