# Quant Cloud Create Environment Action

This GitHub Action creates a new environment in Quant Cloud.

## Usage

```yaml
- uses: quantcdn/quant-cloud-compose-action@v1
  id: compose
  with:
    api_key: ${{ secrets.QUANT_API_KEY }}
    organization: your-org-id
    compose_file: docker-compose.yml

- uses: quantcdn/quant-cloud-create-environment-action@v1
  with:
    api_key: ${{ secrets.QUANT_API_KEY }}
    organization: your-org-id
    app_name: my-app
    environment_name: my-environment
    compose_spec: ${{ steps.compose.outputs.translated_compose }}
    from_environment: staging  # Optional
    base_url: https://dashboard.quantcdn.io/api/v3  # Optional
```

## Inputs

* `api_key`: Your Quant API key (required)
* `organization`: Your Quant organisation ID (required)
* `app_name`: Name of your application (required)
* `environment_name`: Name for the environment (required)
* `compose_spec`: Compose specification for the environment (optional)
* `from_environment`: Name of the environment to clone configuration from (optional)
* `base_url`: Quant Cloud API URL (optional, defaults to https://dashboard.quantcdn.io/api/v3)

## Outputs

* `environment_name`: The name of the created environment 