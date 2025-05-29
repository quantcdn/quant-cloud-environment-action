# Quant Cloud Environment Action

This GitHub Action creates or updates an environment in Quant Cloud.

## Usage

```yaml
- uses: quantcdn/quant-cloud-environment-action@v1
  with:
    api_key: ${{ secrets.QUANT_API_KEY }}
    organization: your-org-id
    app_name: my-app
    environment_name: my-environment
    compose_spec: |
      {
        "containers": [
          {
            "name": "nginx-container-1",
            "imageReference": {
              "type": "external",
              "identifier": "nginx:stable-perl"
            },
            "essential": true,
            "portMappings": [
              {
                "containerPort": 80,
                "protocol": "tcp"
              }
            ]
          }
        ]
      }
    from_environment: staging  # Optional, only used when creating a new environment
    base_url: https://dashboard.quantcdn.io/api/v3  # Optional
```

## Inputs

* `api_key`: Your Quant API key (required)
* `organization`: Your Quant organisation ID (required)
* `app_name`: Name of your application (required)
* `environment_name`: Name for the environment (required)
* `compose_spec`: Compose specification for the environment (required for updates, optional for new environments if from_environment is not provided)
  * Must be a valid JSON string
  * Each container must have a name and imageReference
  * imageReference must have type and identifier fields
* `from_environment`: Name of the environment to clone configuration from (optional, only used when creating a new environment)
* `base_url`: Quant Cloud API URL (optional, defaults to https://dashboard.quantcdn.io/api/v3)

## Outputs

* `environment_name`: The name of the created or updated environment 