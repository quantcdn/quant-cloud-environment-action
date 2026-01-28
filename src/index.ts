import * as core from '@actions/core';
import {
    Environment,
    CreateEnvironmentRequest,
    UpdateEnvironmentRequest,
    EnvironmentsApi,
    Compose,
    Configuration
} from 'quant-ts-client';

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
        const imageSuffix = core.getInput('image_suffix', { required: false });
        const operation = core.getInput('operation', { required: false }) || 'create';
        let minCapacity = core.getInput('min_capacity', { required: false });
        let maxCapacity = core.getInput('max_capacity', { required: false });
        const config = new Configuration({
            basePath: baseUrl,
            accessToken: apiKey
        });
        const client = new EnvironmentsApi(config);

        if (!minCapacity) {
            minCapacity = '1';
        }
        if (!maxCapacity) {
            maxCapacity = '1';
        }

        let state = 'update';
        let environment: Environment;

        core.info('Quant Cloud Environment Action');

        if (operation !== 'delete' && !composeSpec && !fromEnvironment) {
            throw new Error('Either compose_spec or from_environment must be provided (not required for delete operation)');
        }

        // Handle delete operation
        if (operation === 'delete') {
            try {
                await client.deleteEnvironment(organisation, appName, environmentName);
                core.info(`Successfully deleted environment: ${environmentName}`);
                core.setOutput('environment_name', environmentName);
                return;
            } catch (error) {
                const apiError = error as Error & ApiError;
                if (apiError.statusCode === 404 || apiError.body?.message?.includes('not found')) {
                    core.info(`Environment ${environmentName} does not exist, nothing to delete`);
                    core.setOutput('environment_name', environmentName);
                    return;
                } else {
                    throw error;
                }
            }
        }

        try {
            environment = (await client.getEnvironment(organisation, appName, environmentName)).data;
            state = 'update';
            core.info(`Environment ${environmentName} exists, will ${operation === 'create' ? 'update' : operation}`);
        } catch (error) {
            const apiError = error as Error & ApiError;
            if (apiError.statusCode === 404 || apiError.body?.message?.includes('not found')) {
                if (operation === 'update') {
                    throw new Error(`Cannot update environment ${environmentName} - it does not exist`);
                }
                state = 'create';
                core.info(`Environment ${environmentName} does not exist, will create`);
            } else {
                throw error;
            }
        }

        if (state === 'create') {
            const createEnvironmentRequest: any = {
                envName: environmentName,
                minCapacity: parseInt(minCapacity),
                maxCapacity: parseInt(maxCapacity)
            }

            // Only add composeDefinition if composeSpec was provided
            if (composeSpec) {
                createEnvironmentRequest.composeDefinition = removeNullValues(JSON.parse(composeSpec)) || {};
            }

            // Add cloning configuration if specified
            if (fromEnvironment) {
                createEnvironmentRequest.cloneConfigurationFrom = fromEnvironment;
            }

            // Add image suffix if provided - API handles the transformation
            if (imageSuffix) {
                (createEnvironmentRequest as any).imageSuffix = imageSuffix;
            }

            // If neither composeSpec nor fromEnvironment provided, we need an empty compose definition
            if (!composeSpec && !fromEnvironment) {
                createEnvironmentRequest.composeDefinition = {};
            }
            
            const res = await client.createEnvironment(organisation, appName, removeNullValues(createEnvironmentRequest));
            environment = res.data as Environment;
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

            const updateEnvironmentRequest: any = {
                composeDefinition,
                minCapacity: parseInt(minCapacity),
                maxCapacity: parseInt(maxCapacity),
            }

            // Add image suffix if provided - API handles the transformation
            if (imageSuffix) {
                updateEnvironmentRequest.imageSuffix = imageSuffix;
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