function createOpenApiSpec({ host, port }) {
    return {
        openapi: '3.0.3',
        info: {
            title: 'Inventory Service API',
            version: '1.0.0',
            description: 'API for device inventory management with photo upload support.'
        },
        servers: [
            {
                url: `http://${host}:${port}`,
                description: 'Current server'
            }
        ],
        tags: [
            { name: 'Inventory' },
            { name: 'Search' },
            { name: 'Forms' }
        ],
        components: {
            schemas: {
                InventoryItem: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '1741760000000' },
                        name: { type: 'string', example: 'Laptop' },
                        description: { type: 'string', example: 'Office device' },
                        photo: { type: 'string', nullable: true, example: '1741760123456.jpg' }
                    }
                },
                InventoryItemWithPhotoUrl: {
                    allOf: [
                        { $ref: '#/components/schemas/InventoryItem' },
                        {
                            type: 'object',
                            properties: {
                                photo_url: {
                                    type: 'string',
                                    nullable: true,
                                    example: 'http://localhost:3000/inventory/1741760000000/photo'
                                }
                            }
                        }
                    ]
                },
                UpdateInventoryRequest: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', example: 'Laptop Pro' },
                        description: { type: 'string', example: 'Updated description' }
                    }
                },
                SearchResponse: {
                    allOf: [
                        { $ref: '#/components/schemas/InventoryItem' },
                        {
                            type: 'object',
                            properties: {
                                photo_link: {
                                    type: 'string',
                                    example: 'http://localhost:3000/inventory/1741760000000/photo'
                                }
                            }
                        }
                    ]
                }
            }
        },
        paths: {
            '/inventory': {
                get: {
                    tags: ['Inventory'],
                    summary: 'Get all inventory items',
                    responses: {
                        '200': {
                            description: 'List of inventory items',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/InventoryItemWithPhotoUrl' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/register': {
                post: {
                    tags: ['Inventory'],
                    summary: 'Register a new inventory item',
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    required: ['inventory_name'],
                                    properties: {
                                        inventory_name: { type: 'string', example: 'Laptop' },
                                        description: { type: 'string', example: 'Office device' },
                                        photo: { type: 'string', format: 'binary' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Created item',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/InventoryItem' }
                                }
                            }
                        },
                        '400': { description: 'Bad Request: name is required' }
                    }
                }
            },
            '/inventory/{id}': {
                get: {
                    tags: ['Inventory'],
                    summary: 'Get item by ID',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Inventory item',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/InventoryItemWithPhotoUrl' }
                                }
                            }
                        },
                        '404': { description: 'Not found' }
                    }
                },
                put: {
                    tags: ['Inventory'],
                    summary: 'Update item name/description',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UpdateInventoryRequest' }
                            },
                            'application/x-www-form-urlencoded': {
                                schema: { $ref: '#/components/schemas/UpdateInventoryRequest' }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Updated item',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/InventoryItem' }
                                }
                            }
                        },
                        '404': { description: 'Not found' }
                    }
                },
                delete: {
                    tags: ['Inventory'],
                    summary: 'Delete item by ID',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Deleted' },
                        '404': { description: 'Not found' }
                    }
                }
            },
            '/inventory/{id}/photo': {
                get: {
                    tags: ['Inventory'],
                    summary: 'Get item photo',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Image content',
                            content: {
                                'image/jpeg': {
                                    schema: {
                                        type: 'string',
                                        format: 'binary'
                                    }
                                }
                            }
                        },
                        '404': { description: 'Not found' }
                    }
                },
                put: {
                    tags: ['Inventory'],
                    summary: 'Update item photo',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        photo: { type: 'string', format: 'binary' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Photo updated' },
                        '404': { description: 'Not found' }
                    }
                }
            },
            '/search': {
                get: {
                    tags: ['Search'],
                    summary: 'Search item by ID (query params)',
                    parameters: [
                        {
                            name: 'id',
                            in: 'query',
                            required: true,
                            schema: { type: 'string' }
                        },
                        {
                            name: 'includePhoto',
                            in: 'query',
                            required: false,
                            schema: { type: 'string', example: 'true' }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Search result',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SearchResponse' }
                                }
                            }
                        },
                        '404': { description: 'Not Found' }
                    }
                },
                post: {
                    tags: ['Search'],
                    summary: 'Search item by ID (form body)',
                    requestBody: {
                        required: true,
                        content: {
                            'application/x-www-form-urlencoded': {
                                schema: {
                                    type: 'object',
                                    required: ['id'],
                                    properties: {
                                        id: { type: 'string' },
                                        has_photo: { type: 'string', example: 'true' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Search result',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SearchResponse' }
                                }
                            }
                        },
                        '404': { description: 'Not Found' }
                    }
                }
            },
            '/RegisterForm.html': {
                get: {
                    tags: ['Forms'],
                    summary: 'Get register HTML form',
                    responses: {
                        '200': { description: 'HTML page' }
                    }
                }
            },
            '/SearchForm.html': {
                get: {
                    tags: ['Forms'],
                    summary: 'Get search HTML form',
                    responses: {
                        '200': { description: 'HTML page' }
                    }
                }
            }
        }
    };
}

module.exports = createOpenApiSpec;
