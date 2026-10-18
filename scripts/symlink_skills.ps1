# Antigravity Global Skills Linker for Windows (PowerShell)
$ProjectRoot = Resolve-Path "$PSScriptRoot\.."
$SourceSkillsDir = Join-Path $ProjectRoot ".agents\skills"
$TargetGlobalDir = Join-Path $HOME ".gemini\config\skills"

Write-Host "=== Antigravity Global Skills Linker (PowerShell) ===" -ForegroundColor Cyan
Write-Host "Source Dir : $SourceSkillsDir" -ForegroundColor Yellow
Write-Host "Target Dir : $TargetGlobalDir" -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path $SourceSkillsDir)) {
    Write-Host "[ERROR] Source directory not found: $SourceSkillsDir" -ForegroundColor Red
    exit 1
}

# Create target directory if needed
if (-not (Test-Path $TargetGlobalDir)) {
    New-Item -ItemType Directory -Path $TargetGlobalDir -Force | Out-Null
}

$count = 0
$skillFolders = Get-ChildItem -Path $SourceSkillsDir -Directory

foreach ($folder in $skillFolders) {
    $skillName = $folder.Name
    $targetPath = Join-Path $TargetGlobalDir $skillName
    $skillFile = Join-Path $folder.FullName "SKILL.md"

    if (-not (Test-Path $skillFile)) {
        Write-Host "[SKIP] $skillName (SKILL.md not found)" -ForegroundColor DarkYellow
        continue
    }

    # Remove existing link/directory if present
    if (Test-Path $targetPath) {
        $item = Get-Item -LiteralPath $targetPath -Force
        if ($item.Attributes -match "ReparsePoint") {
            [System.IO.Directory]::Delete($targetPath)
        } else {
            Remove-Item -LiteralPath $targetPath -Recurse -Force
        }
        Write-Host "[UPDATE] Removed previous link for: $skillName" -ForegroundColor DarkGray
    }

    # Create Junction (Works on all Windows versions without Administrator privileges)
    try {
        New-Item -ItemType Junction -Path $targetPath -Target $folder.FullName | Out-Null
        Write-Host "[SUCCESS] Linked: $skillName -> $targetPath" -ForegroundColor Green
        $count++
    }
    catch {
        Write-Host "[ERROR] Failed to link $skillName : $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Done! Linked $count skills into Antigravity Global Config ===" -ForegroundColor Green
Write-Host "Target: $TargetGlobalDir" -ForegroundColor Cyan
