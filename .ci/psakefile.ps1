#! /usr/bin/env pwsh

properties {
    $RepositoryRoot = ( Join-Path $PSScriptRoot ".." -Resolve )
    $projectConfiguration = @{
        RepositoryRoot =  $RepositoryRoot
        ScriptsRoot = ( Join-Path $RepositoryRoot "src/scripts" -Resolve )
        CdkTfRoot = ( Join-Path $RepositoryRoot "src/cdktf" -Resolve )
    }
    
}

# Public tasks available to be used

Task default -Depends .print-configuration -description "Default entry point"
Task aws-login -depends ".aws-login" -description "Ensures logged into AWS"
Task synth -depends .print-configuration,.aws-login,.synth -description "Synthesizes the teraform scripts"

$stacks = @('iam-core', 's3-backup', 'terraform-state')
foreach ($stack in $stacks)
{
    Task "plan-$($stack)" -depends .print-configuration,.aws-login,".plan-$($stack)" -description "Runs terraform plan for $($stack) stack"
    Task "deploy-$($stack)" -depends .print-configuration,.aws-login,".deploy-$($stack)" -description "Runs terraform deploy for $($stack) stack"
}

# Internal tasks not intended to be called directly

Task .print-configuration {
    Write-Host "$("=" * 10) Project Configuration $("=" * 10) "
    Write-Host ( ConvertTo-Json $projectConfiguration -Depth 5 )
}

Task .aws-login {
    & ( Join-Path $projectConfiguration.ScriptsRoot "aws-login.ps1" )
}

Task .synth {
    Push-Location $projectConfiguration.CdkTfRoot
    try
    {
        Psake\Exec { npx cdktf synth }
    }
    finally
    {
        Pop-Location
    }
}

foreach ($stack in $stacks) {
    Invoke-Expression @"
    Task ".plan-$($stack)" {
        `$script:tfStack = '$($stack)'
        Invoke-Task .plan
    }
    
    Task ".deploy-$($stack)" {
        `$script:tfStack = '$($stack)'
        Invoke-Task .deploy
    }
"@
}

Task .plan {
    Push-Location $projectConfiguration.CdkTfRoot
    try
    {
        $cdktfCommand = "npx cdktf plan $script:tfStack"
        Write-Host $cdktfCommand
        psake\Exec { Invoke-Expression $cdktfCommand }
    }
    finally
    {
        Pop-Location
    }
}

Task .deploy {
    Push-Location $projectConfiguration.CdkTfRoot
    try
    {
        $cdktfCommand = "npx cdktf deploy $script:tfStack"
        Write-Host $cdktfCommand
        psake\Exec { Invoke-Expression $cdktfCommand }
        
    }
    finally
    {
        Pop-Location
    }
}