const mockCore = {
    getInput: jest.fn(),
    setOutput: jest.fn(),
    setFailed: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
};
const mockApi = {
    getEnvironment: jest.fn(),
    createEnvironment: jest.fn(),
    updateEnvironment: jest.fn(),
    deleteEnvironment: jest.fn()
};

jest.mock('@actions/core', () => mockCore);
jest.mock('@quantcdn/quant-client', () => ({
    Configuration: jest.fn(),
    EnvironmentsApi: jest.fn(() => mockApi)
}));

const flush = () => new Promise(resolve => setTimeout(resolve, 10));

async function runAction(inputs: Record<string, string>) {
    mockCore.getInput.mockImplementation((name: string) => inputs[name] ?? '');
    jest.isolateModules(() => {
        require('./index');
    });
    await flush();
}

const base = {
    api_key: 'k',
    organization: 'org',
    app_name: 'app',
    environment_name: 'env',
    compose_spec: JSON.stringify({ containers: [{ name: 'web', imageReference: { type: 'external', identifier: 'nginx' } }] })
};

describe('capacity inputs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockApi.createEnvironment.mockResolvedValue({ data: { envName: 'env' } });
        mockApi.updateEnvironment.mockResolvedValue({ data: {} });
    });

    it('does not send capacity on update when unset', async () => {
        mockApi.getEnvironment.mockResolvedValue({ data: {} });
        await runAction(base);
        expect(mockCore.setFailed).not.toHaveBeenCalled();
        const body = mockApi.updateEnvironment.mock.calls[0][3];
        expect(body).not.toHaveProperty('minCapacity');
        expect(body).not.toHaveProperty('maxCapacity');
    });

    it('does not send capacity on create when unset', async () => {
        mockApi.getEnvironment.mockRejectedValue({ status: 404 });
        await runAction(base);
        const body = mockApi.createEnvironment.mock.calls[0][2];
        expect(body).not.toHaveProperty('minCapacity');
        expect(body).not.toHaveProperty('maxCapacity');
    });

    it('sends capacity on update when set', async () => {
        mockApi.getEnvironment.mockResolvedValue({ data: {} });
        await runAction({ ...base, min_capacity: '2', max_capacity: '5' });
        const body = mockApi.updateEnvironment.mock.calls[0][3];
        expect(body).toMatchObject({ minCapacity: 2, maxCapacity: 5 });
    });

    it('sends capacity on create when set, including 0 minimum', async () => {
        mockApi.getEnvironment.mockRejectedValue({ status: 404 });
        await runAction({ ...base, min_capacity: '0', max_capacity: '3' });
        const body = mockApi.createEnvironment.mock.calls[0][2];
        expect(body).toMatchObject({ minCapacity: 0, maxCapacity: 3 });
    });
});
