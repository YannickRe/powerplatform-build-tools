// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as tl from 'azure-pipelines-task-lib/task';
import { copyEnvironment, EnvironmentResult } from "@microsoft/powerplatform-cli-wrapper/dist/actions";
import { BuildToolsHost } from "../../../host/BuildToolsHost";
import { TaskParser } from "../../../parser/TaskParser";
import { getCredentials } from "../../../params/auth/getCredentials";
import { AzurePipelineTaskDefiniton } from "../../../parser/AzurePipelineDefinitions";
import { BuildToolsRunnerParams } from "../../../host/BuildToolsRunnerParams";
import { isRunningOnAgent } from "../../../params/auth/isRunningOnAgent";
import { EnvUrlVariableName, EnvIdVariableName, SetTaskOutputVariable } from "../../../host/PipelineVariables";

import * as taskDefinitionData from "./task.json";

(async () => {
  if (isRunningOnAgent()) {
    await main();
  }
})().catch(error => {
  tl.setResult(tl.TaskResult.Failed, error);
});

export async function main(): Promise<void> {
  const taskParser = new TaskParser();
  const parameterMap = taskParser.getHostParameterEntries((taskDefinitionData as unknown) as AzurePipelineTaskDefiniton);
  const isDiagnosticsMode = tl.getVariable('agent.diagnostic');

  const copyResult: EnvironmentResult = await copyEnvironment({
    credentials: getCredentials(),
    sourceEnvironment: parameterMap['Environment'],
    targetEnvironment: parameterMap['TargetEnvironmentUrl'],
    copyType: parameterMap['CopyType'],
    overrideFriendlyName: parameterMap['OverrideFriendlyName'],
    friendlyTargetEnvironmentName: parameterMap['FriendlyName'],
    skipAuditData: parameterMap['SkipAuditData'],
    logToConsole: isDiagnosticsMode ? true : false
  }, new BuildToolsRunnerParams(), new BuildToolsHost());

  if (!copyResult.environmentUrl || !copyResult.environmentId) {
    return tl.setResult(tl.TaskResult.SucceededWithIssues, 'CopyEnvironment call did NOT return the expected environment URL!');
  }
  // set output variables:
  SetTaskOutputVariable(EnvUrlVariableName, copyResult.environmentUrl);
  SetTaskOutputVariable(EnvIdVariableName, copyResult.environmentId);
}
