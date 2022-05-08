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
Task plan-iam-core -depends .print-configuration,.aws-login,.plan-iam-core -description "Runs terraform plan for iam-core stack"
Task deploy-iam-core -depends .print-configuration,.aws-login,.deploy-iam-core -description "Runs terraform deploy for iam-core stack"
Task plan-terraform-state -depends .print-configuration,.aws-login,.plan-terraform-state -description "Runs terraform plan for terraform-state stack"

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

Task .plan-iam-core {
    $script:tfStack = "iam-core"
    Invoke-Task .plan
}

Task .deploy-iam-core {
    $script:tfStack = "iam-core"
    Invoke-Task .deploy
}

Task .plan-terraform-state {
    $script:tfStack = "terraform-state"
    Invoke-Task .plan
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