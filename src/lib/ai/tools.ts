// Tool definitions for the LLM (OpenAI function calling format)

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required?: Array<string>
    }
  }
}

export const TOOL_DEFINITIONS: Array<ToolDefinition> = [
  {
    type: 'function',
    function: {
      name: 'set_layers',
      description:
        'Enable or disable map layers. Only include layers you want to change. Available layers: complaints, crime, transit, vacancy, foodAccess, arpa, demographics.',
      parameters: {
        type: 'object',
        properties: {
          layers: {
            type: 'object',
            properties: {
              complaints: { type: 'boolean' },
              crime: { type: 'boolean' },
              transit: { type: 'boolean' },
              vacancy: { type: 'boolean' },
              foodAccess: { type: 'boolean' },
              arpa: { type: 'boolean' },
              demographics: { type: 'boolean' },
            },
          },
        },
        required: ['layers'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_filters',
      description:
        'Set sub-toggle filters for active layers. Only include filters you want to change.',
      parameters: {
        type: 'object',
        properties: {
          complaintsCategory: {
            type: 'string',
            description: 'Filter complaints by category (e.g. "Trash", "Derelict", "all")',
          },
          complaintsMode: {
            type: 'string',
            enum: ['choropleth', 'heatmap'],
            description: 'Complaints visualization mode',
          },
          crimeCategory: {
            type: 'string',
            description: 'Filter crime by category (e.g. "Assault", "Theft", "all")',
          },
          crimeMode: {
            type: 'string',
            enum: ['choropleth', 'heatmap'],
            description: 'Crime visualization mode',
          },
          demographicsMetric: {
            type: 'string',
            enum: ['population', 'vacancyRate', 'popChange'],
            description: 'Demographics choropleth metric',
          },
          arpaCategory: {
            type: 'string',
            description: 'Filter ARPA spending by category',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'select_neighborhood',
      description:
        'Select a neighborhood by name. Uses fuzzy matching. This opens the detail panel with neighborhood info.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Neighborhood name (e.g. "Dutchtown", "Downtown", "The Ville")',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'select_entity',
      description: 'Select a specific entity on the map by type and ID.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['stop', 'grocery', 'foodDesert'],
            description: 'Entity type',
          },
          id: {
            type: 'string',
            description: 'Entity ID (string for stops/food deserts, number as string for grocery)',
          },
        },
        required: ['type', 'id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'toggle_analytics',
      description: 'Open or close the analytics panel at the bottom of the dashboard.',
      parameters: {
        type: 'object',
        properties: {
          expanded: {
            type: 'boolean',
            description: 'Whether the analytics panel should be open',
          },
        },
        required: ['expanded'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'configure_chart',
      description:
        'Switch the chart builder to a specific dataset and optionally apply a preset. Opens the analytics panel if not already open.',
      parameters: {
        type: 'object',
        properties: {
          datasetKey: {
            type: 'string',
            description:
              'Dataset key (e.g. "complaints-daily", "crime-category", "vacancy-by-neighborhood", "arpa-monthly", "demographics-population", "food-desert-tracts")',
          },
          presetName: {
            type: 'string',
            description: 'Optional preset name to apply (e.g. "Trend + Weather", "Category Breakdown")',
          },
        },
        required: ['datasetKey'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clear_selection',
      description: 'Clear any selected entity and close the detail panel.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },

  // ── Data Retrieval Tools (resolved client-side, not UI actions) ──

  {
    type: 'function',
    function: {
      name: 'get_city_summary',
      description:
        'Get high-level stats across all loaded datasets (complaints total, crime total, vacancy count, transit routes/stops, ARPA spending, demographics, food access). Call this first when answering general questions about the city.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_neighborhood_detail',
      description:
        'Get a deep dive on one neighborhood: complaints, crime, vacancy, transit access, food access, demographics, and composite equity score.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Neighborhood name (e.g. "Dutchtown", "Downtown", "The Ville")',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_rankings',
      description:
        'Rank neighborhoods by a metric. Returns top/bottom neighborhoods with values.',
      parameters: {
        type: 'object',
        properties: {
          metric: {
            type: 'string',
            enum: ['complaints', 'crime', 'vacancy', 'population', 'vacancyRate', 'popChange'],
            description: 'Metric to rank by',
          },
          order: {
            type: 'string',
            enum: ['desc', 'asc'],
            description: 'Sort order (default: desc = highest first)',
          },
          limit: {
            type: 'number',
            description: 'Number of results (default: 10, max: 20)',
          },
        },
        required: ['metric'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_category_breakdown',
      description:
        'Get complaints or crime broken down by category, optionally filtered to a single neighborhood.',
      parameters: {
        type: 'object',
        properties: {
          dataset: {
            type: 'string',
            enum: ['complaints', 'crime'],
            description: 'Which dataset to break down',
          },
          neighborhood: {
            type: 'string',
            description: 'Optional neighborhood name to filter to',
          },
        },
        required: ['dataset'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_arpa_data',
      description:
        'Get ARPA spending summary: total spent, project count, top vendors, and category breakdown. Optionally filter by category.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Optional category to filter by (e.g. "Public Health")',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_food_access',
      description:
        'Get food desert census tracts and grocery store locations. Returns tract count, LILA tract count, grocery store count, and details.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
]

/** Names of tools that retrieve data (resolved client-side) vs UI tools (dispatched to dashboard) */
export const DATA_TOOL_NAMES = new Set([
  'get_city_summary',
  'get_neighborhood_detail',
  'get_rankings',
  'get_category_breakdown',
  'get_arpa_data',
  'get_food_access',
])
