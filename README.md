# Quant Cloud Environment Action

This GitHub Action creates or updates an environment in Quant Cloud.

## Usage

### Clone from Existing Environment (Recommended)

```yaml
- uses: quantcdn/quant-cloud-environment-action@v1
  with:
    api_key: ${{ secrets.QUANT_API_KEY }}
    organization: your-org-id
    app_name: my-app
    environment_name: my-new-environment
    from_environment: production  # Clone configuration from this environment
    base_url: https://dashboard.quantcdn.io/api/v3  # Optional
```

### Clone with Image Suffix (Feature Branches)

```yaml
- uses: quantcdn/quant-cloud-environment-action@v1
  with:
    api_key: ${{ secrets.QUANT_API_KEY }}
    organization: your-org-id
    app_name: my-app
    environment_name: feature-xyz
    from_environment: production  # Base configuration to clone from
    image_suffix: feature-xyz  # Transforms "cli-latest" → "cli-feature-xyz"
```

### Delete Environment

```yaml
- uses: quantcdn/quant-cloud-environment-action@v1
  with:
    api_key: ${{ secrets.QUANT_API_KEY }}
    organization: your-org-id
    app_name: my-app
    environment_name: feature-xyz
    operation: delete  # Deletes the specified environment
```

### Force Update Existing Environment

```yaml
- uses: quantcdn/quant-cloud-environment-action@v1
  with:
    api_key: ${{ secrets.QUANT_API_KEY }}
    organization: your-org-id
    app_name: my-app
    environment_name: my-environment
    operation: update  # Fails if environment doesn't exist
    compose_spec: |
      {
        "containers": [...]
      }
```

### Clone with Container Overrides

```yaml
- uses: quantcdn/quant-cloud-environment-action@v1
  with:
    api_key: ${{ secrets.QUANT_API_KEY }}
    organization: your-org-id
    app_name: my-app
    environment_name: my-environment
    from_environment: production  # Base configuration to clone from
    compose_spec: |  # Optional overrides - inherits from base environment
      {
        "containers": [
          {
            "name": "nginx-container-1",
            "imageReference": {
              "type": "external",
              "identifier": "nginx:latest"  # Override just the image version
            }
          }
        ]
      }
```

### Fresh Environment (No Cloning)

```yaml
- uses: quantcdn/quant-cloud-environment-action@v1
  with:
    api_key: ${{ secrets.QUANT_API_KEY }}
    organization: your-org-id
    app_name: my-app
    environment_name: my-environment
    compose_spec: |  # Required when not cloning
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
```

## Inputs

* `api_key`: Your Quant API key (required)
* `organization`: Your Quant organisation ID (required)
* `app_name`: Name of your application (required)
* `environment_name`: Name for the environment (required)
* `compose_spec`: Compose specification for the environment
  * **Required** when creating a fresh environment (no `from_environment`)
  * **Required** when updating an existing environment 
  * **Optional** when cloning from an existing environment (used for container overrides)
  * Must be a valid JSON string
  * Each container must have a name and imageReference
  * imageReference must have type and identifier fields
* `from_environment`: Name of the environment to clone configuration from
  * **Optional** - only used when creating a new environment
  * When provided, the new environment inherits all configuration from this source environment
  * `compose_spec` becomes optional and only used for selective container overrides
* `image_suffix`: Suffix to automatically transform container image names
  * **Optional** - transforms image references during creation/updates
  * Example: `"feature-xyz"` transforms `"cli-latest"` → `"cli-feature-xyz"`
  * Works with both cloning (`from_environment`) and explicit compose specifications
  * Perfect for feature branch deployments with custom image tags
* `operation`: Operation to perform
  * **Optional** - defaults to `create`
  * Valid values: `create`, `update`, `delete`
  * `create`: Creates new environment or updates if it exists
  * `update`: Updates existing environment (fails if doesn't exist)
  * `delete`: Deletes environment (succeeds silently if doesn't exist)
* `base_url`: Quant Cloud API URL (optional, defaults to https://dashboard.quantcdn.io/api/v3)

## Outputs

* `environment_name`: The name of the created or updated environment 