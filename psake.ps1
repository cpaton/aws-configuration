#! /usr/bin/env pwsh

<#
.SYNOPSIS
Helper script for running PSake build scripts

.DESCRIPTION
Implements conventions for working with psake.  Script is generic and is designed to be used across all projects.
Assumes the PSake script to be executed can be found in .ci/psakefile.ps1
#>
[CmdletBinding()]
param
(
    # PSake tasks to run.  Defaults to default
    [Parameter(Position = 1)]
    # Tab completion for PSake targets (hides targets that start with .)
    [ArgumentCompleter( {
        param ( $commandName,
                $parameterName,
                $wordToComplete,
                $commandAst,
                $fakeBoundParameters )

        if ($null -eq (Get-Command Get-PSakeScriptTasks -ErrorAction SilentlyContinue))
        {
            return
        }
        $taskList = Get-PSakeScriptTasks -buildFile ( Join-Path $PSScriptRoot ".ci/psakefile.ps1" )
        $available = $taskList | Where-Object { $_.Name -notlike '.*' } | Foreach-Object { $_.Name }
        $available | Where-Object { $_ -like "*$($wordToComplete)*" }
    } )]
    [array]
    $Tasks = $("default"),
    # Do not run a build - list the tasks that are available
    [Parameter()]
    [switch]
    $List,
    # Properties overrides to set on the build
    [Parameter()]
    [hashtable]
    $Properties = $(@{})
)

$ErrorActionPreference = "Stop"

try
{
    # Check required version of Psake is available
    $psakeModuleDefinition = @{
        ModuleName = "psake"
        ModuleVersion = "4.9.0"
    }
    if (-not (Get-Module -FullyQualifiedName $psakeModuleDefinition -ListAvailable))
    {
        Write-Host "Installing $($psakeModuleDefinition.ModuleName) v$($psakeModuleDefinition.ModuleVersion)"
        Install-Module -Name $psakeModuleDefinition.ModuleName -RequiredVersion $psakeModuleDefinition.ModuleVersion -Scope CurrentUser -AllowClobber
    }
    Remove-Module -Name $psakeModuleDefinition.ModuleName -Force -ErrorAction SilentlyContinue
    Import-Module -Name $psakeModuleDefinition.ModuleName -Force

    if ($List)
    {
        $taskList = Get-PSakeScriptTasks -buildFile ( Join-Path $PSScriptRoot ".ci/psakefile.ps1" )
        return ( $taskList | Where-Object { -not $_.Name.StartsWith(".") } )
    }

    $Properties.RepositoryRoot = $PSScriptRoot        
    
    Invoke-psake -buildFile ( Join-Path $PSScriptRoot ".ci/psakefile.ps1" ) -taskList $Tasks -properties $Properties
    if (-not $psake.build_success)
    {
        Get-Error
        exit 1
    }
}
catch
{
    Get-Error
    throw
}