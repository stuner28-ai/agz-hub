param(
  [string]$Pack = "core-recommended",
  [string]$Dest = "$HOME\.agents\skills",
  [switch]$Force
)
$ArgsList = @("scripts/install.py", "--pack", $Pack, "--dest", $Dest)
if ($Force) { $ArgsList += "--force" }
python @ArgsList
