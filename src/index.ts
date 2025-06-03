import * as core from '@actions/core';
import {
    Environment,
    CreateEnvironmentRequest,
    UpdateEnvironmentRequest,
    EnvironmentsApi,
    Compose
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

function removeNullValues(obj: any): any {
    if (obj === null || obj === undefined) {
        return undefined;
    }
    if (Array.isArray(obj)) {
        return obj.map(removeNullValues).filter(x => x !== undefined);
    }
    if (typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            const cleaned = removeNullValues(value);
            if (cleaned !== undefined) {
                result[key] = cleaned;
            }
        }
        return Object.keys(result).length ? result : undefined;
    }
    return obj;
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
        let minCapacity = core.getInput('min_capacity', { required: false });
        let maxCapacity = core.getInput('max_capacity', { required: false });
        const client = new EnvironmentsApi(baseUrl);
        client.setDefaultAuthentication(apiOpts(apiKey));

        if (!minCapacity) {
            minCapacity = '1';
        }
        if (!maxCapacity) {
            maxCapacity = '1';
        }

        let state = 'update';
        let environment: Environment;

        core.info('Quant Cloud Environment Action');

        if (!composeSpec && !fromEnvironment) {
            throw new Error('Either compose_spec or from_environment must be provided');
        }

        try {
            environment = (await client.getEnvironment(organisation, appName, environmentName)).body;
            core.info(`Environment ${environmentName} exists, will update`);
        } catch (error) {
            const apiError = error as Error & ApiError;
            if (apiError.statusCode === 404 || apiError.body?.message?.includes('not found')) {
                state = 'create';
                core.info(`Environment ${environmentName} does not exist, will create`);
            } else {
                throw error;
            }
        }

        if (state === 'create') {
            const createEnvironmentRequest: CreateEnvironmentRequest = {
                envName: environmentName,
                minCapacity: parseInt(minCapacity),
                maxCapacity: parseInt(maxCapacity),
                composeDefinition: {}
            }

            if (composeSpec) {
                createEnvironmentRequest.composeDefinition = removeNullValues(JSON.parse(composeSpec)) || {};
            }

            if (fromEnvironment) {
                createEnvironmentRequest.cloneConfigurationFrom = fromEnvironment;
            }
            
            const res = await client.createEnvironment(organisation, appName, removeNullValues(createEnvironmentRequest));
            environment = res.body as Environment;
            core.info(`Successfully created environment: ${environment.envName}`);

        } else {
            if (!composeSpec) {
                throw new Error('compose_spec is required for updating an environment');
            }
            const composeDefinition = removeNullValues(JSON.parse(composeSpec)) || {};
            
            // Ensure imageReference is properly structured with optional fields
            if (composeDefinition.containers) {
                composeDefinition.containers = composeDefinition.containers.map((container: any) => {
                    if (!container.imageReference) {
                        throw new Error(`Container ${container.name} is missing imageReference`);
                    }
                    return container;
                });
            }

            const updateEnvironmentRequest = {
                composeDefinition,
                minCapacity: parseInt(minCapacity),
                maxCapacity: parseInt(maxCapacity),
            }
            try {
                const response = await client.updateEnvironment(organisation, appName, environmentName, removeNullValues(updateEnvironmentRequest));
                core.info(`Successfully updated environment: ${environmentName}`);
            } catch (error) {
                const apiError = error as Error & ApiError;
                if (apiError.body) {
                    core.error(`API Error: ${JSON.stringify(apiError.body)}`);
                }
                throw error;
            }
        }

        core.setOutput('environment_name', environmentName);

    } catch (error) {
        const apiError = error as Error & ApiError;
        core.setFailed(apiError.body?.message != null ? apiError.body?.message : 'Unknown error');
    }

    return;
}

run(); 