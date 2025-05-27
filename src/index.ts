import * as core from '@actions/core';
import {
    Environment,
    CreateEnvironmentRequest,
    UpdateEnvironmentComposeRequest,
    EnvironmentsApi
} from 'quant-ts-client';

const apiOpts = (apiKey: string) => {
    return {
        applyToRequest: (requestOptions: any) => {
            if (requestOptions && requestOptions.headers) {
                requestOptions.headers["Authorization"] = `Bearer ${apiKey}`;
            }
        }
    }
}

interface ApiError {
    statusCode?: number;
    body?: {
        message?: string;
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

        let state = 'update';
        let environment: Environment;

        if (!composeSpec && !fromEnvironment) {
            throw new Error('Either compose_spec or from_environment must be provided');
        }

        try {
            environment = (await client.getEnvironment(organisation, appName, environmentName)).body;
            core.info(`Environment ${environmentName} exists, will update`);
        } catch (error) {
            const apiError = error as Error & ApiError;
            if (apiError.statusCode === 404) {
                state = 'create';
                core.info(`Environment ${environmentName} does not exist, will create`);
            } else {
                throw error;
            }
        }

        if (state === 'create') {
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

            const res = await client.createEnvironment(organisation, appName, createEnvironmentRequest);
            environment = res.body as Environment;
            core.info(`Successfully created environment: ${environment.envName}`);

        } else {
            if (!composeSpec) {
                throw new Error('compose_spec is required for updating an environment');
            }
            const updateEnvironmentRequest: UpdateEnvironmentComposeRequest = {
                composeDefinition: JSON.parse(composeSpec)
            }
            await client.updateEnvironmentCompose(organisation, appName, environmentName, updateEnvironmentRequest);
            core.info(`Successfully updated environment: ${environmentName}`);
        }

        core.setOutput('environment_name', environmentName);

    } catch (error) {
        const apiError = error as Error & ApiError;
        core.setFailed(apiError.body?.message || 'Unknown error');
    }

    return;
}

run(); 