import * as core from '@actions/core';
import {
    Environment,
    CreateEnvironmentRequest,
    EnvironmentsApi
} from 'quant-ts-client';

const apiOpts = (apiKey: string) => {
    return{
        applyToRequest: (requestOptions: any) => {
            if (requestOptions && requestOptions.headers) {
                requestOptions.headers["Authorization"] = `Bearer ${apiKey}`;
            }
        }
    }
}

/**
 * This action creates a new environment in Quant Cloud.
 * 
 * @returns The name of the created environment.
 */
async function run(): Promise<void> {
  try {
    const apiKey = core.getInput('api_key', { required: true });
    const appName = core.getInput('app_name', { required: true });
    const organisation = core.getInput('organization', { required: true });
    const environmentName = core.getInput('environment_name', { required: true });
    const baseUrl = core.getInput('base_url') || 'https://dashboard.quantcdn.io/api/v3';
    const fromEnvironment = core.getInput('from_environment', { required: false });
    const composeSpec = core.getInput('compose_spec', { required: false });

    const client = new EnvironmentsApi(baseUrl);
    client.setDefaultAuthentication(apiOpts(apiKey));

    const createEnvironmentRequest: CreateEnvironmentRequest = {
        envName: environmentName,
        composeDefinition: {}
    }

    if (composeSpec) {
        createEnvironmentRequest.composeDefinition = JSON.parse(composeSpec);
    }

    if (fromEnvironment) {
        createEnvironmentRequest.cloneConfigurationFrom = fromEnvironment;
    }

    const environment = await client.createEnvironment(organisation, appName, createEnvironmentRequest);

    core.setOutput('environment_name', environment.body.envName);
  } catch (error) {
    if (error instanceof Error) {
        core.setFailed(error.message);
    } else {
        core.setFailed('An unknown error occurred');
    }
  }
}

run(); 