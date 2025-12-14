const fs = require('fs');
const path = require('path');

/**
 * Parser for Bubble.io app export files
 * Extracts pages, elements, workflows, data types, and styling information
 */

function parseBubbleFile(inputPath, outputDir) {
  console.log('Reading Bubble.io file...');
  const fileContent = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(fileContent);
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const extracted = {
    pages: {},
    elements: {},
    workflows: {},
    dataTypes: {},
    styles: {},
    api: {},
    settings: {}
  };

  // Extract pages
  if (data.pages) {
    console.log(`Found ${Object.keys(data.pages).length} pages`);
    for (const [pageId, page] of Object.entries(data.pages)) {
      extracted.pages[pageId] = {
        id: pageId,
        name: page.name || pageId,
        elements: page.elements || {},
        workflows: page.workflows || {},
        conditions: page.conditions || {}
      };
    }
  }

  // Recursively extract all elements from pages
  function extractElements(elements, parentId = null) {
    if (!elements) return;
    
    for (const [elemId, element] of Object.entries(elements)) {
      if (!extracted.elements[elemId]) {
        extracted.elements[elemId] = {
          id: elemId,
          type: element.type || 'Unknown',
          properties: element.properties || {},
          parent: element.current_parent || parentId,
          default_name: element.default_name || elemId,
          page: null // Will be set when processing pages
        };
      }
      
      // Recursively extract nested elements
      if (element.elements) {
        extractElements(element.elements, elemId);
      }
    }
  }

  // Extract elements from pages
  if (data.pages) {
    console.log('Extracting elements from pages...');
    for (const [pageId, page] of Object.entries(data.pages)) {
      if (page.elements) {
        extractElements(page.elements);
        // Mark elements as belonging to this page
        for (const elemId of Object.keys(page.elements)) {
          if (extracted.elements[elemId]) {
            extracted.elements[elemId].page = pageId;
          }
        }
      }
    }
  }

  // Extract element definitions (reusable components)
  if (data.element_definitions) {
    console.log('Extracting element definitions...');
    for (const [defId, definition] of Object.entries(data.element_definitions)) {
      if (definition.elements) {
        extractElements(definition.elements);
      }
    }
  }

  // Extract workflows
  if (data.pages) {
    for (const [pageId, page] of Object.entries(data.pages)) {
      if (page.workflows) {
        for (const [workflowId, workflow] of Object.entries(page.workflows)) {
          extracted.workflows[workflowId] = {
            id: workflowId,
            page: pageId,
            name: workflow.name || workflowId,
            events: workflow.events || [],
            actions: workflow.actions || []
          };
        }
      }
    }
  }

  // Extract data types (user_types)
  if (data.user_types) {
    console.log(`Found ${Object.keys(data.user_types).length} data types`);
    for (const [typeId, typeDef] of Object.entries(data.user_types)) {
      extracted.dataTypes[typeId] = {
        id: typeId,
        name: typeDef.name || typeId,
        fields: typeDef.fields || {},
        custom_fields: typeDef.custom_fields || {}
      };
    }
  }

  // Extract styles
  if (data.styles) {
    extracted.styles = data.styles;
  }

  // Extract API information
  if (data.api) {
    extracted.api = {
      workflows: data.api.workflows || {},
      endpoints: data.api.endpoints || {}
    };
  }

  // Extract settings
  if (data.settings) {
    extracted.settings = {
      app_name: data.settings.app_name || 'Bubble App',
      default_language: data.settings.default_language,
      timezone: data.settings.timezone
    };
  }

  // Save extracted data
  fs.writeFileSync(
    path.join(outputDir, 'extracted-pages.json'),
    JSON.stringify(extracted.pages, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'extracted-elements.json'),
    JSON.stringify(extracted.elements, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'extracted-workflows.json'),
    JSON.stringify(extracted.workflows, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'extracted-data-types.json'),
    JSON.stringify(extracted.dataTypes, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'extracted-styles.json'),
    JSON.stringify(extracted.styles, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'extracted-api.json'),
    JSON.stringify(extracted.api, null, 2)
  );

  // Create summary
  const summary = {
    total_pages: Object.keys(extracted.pages).length,
    total_elements: Object.keys(extracted.elements).length,
    total_workflows: Object.keys(extracted.workflows).length,
    total_data_types: Object.keys(extracted.dataTypes).length,
    pages: Object.keys(extracted.pages).map(id => ({
      id,
      name: extracted.pages[id].name,
      element_count: Object.keys(extracted.pages[id].elements || {}).length,
      workflow_count: Object.keys(extracted.pages[id].workflows || {}).length
    })),
    element_types: getElementTypeCounts(extracted.elements),
    data_types: Object.keys(extracted.dataTypes).map(id => ({
      id,
      name: extracted.dataTypes[id].name,
      field_count: Object.keys(extracted.dataTypes[id].fields || {}).length
    }))
  };

  fs.writeFileSync(
    path.join(outputDir, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log('\nExtraction complete!');
  console.log(`Pages: ${summary.total_pages}`);
  console.log(`Elements: ${summary.total_elements}`);
  console.log(`Workflows: ${summary.total_workflows}`);
  console.log(`Data Types: ${summary.total_data_types}`);
  console.log(`\nOutput saved to: ${outputDir}`);

  return { extracted, summary };
}

function getElementTypeCounts(elements) {
  const counts = {};
  for (const element of Object.values(elements)) {
    const type = element.type || 'Unknown';
    counts[type] = (counts[type] || 0) + 1;
  }
  return counts;
}

// Run parser if called directly
if (require.main === module) {
  const inputPath = process.argv[2] || path.join(__dirname, '..', 'jeremyw-61643.bubble');
  const outputDir = path.join(__dirname, '..', 'parser', 'output');
  
  try {
    parseBubbleFile(inputPath, outputDir);
  } catch (error) {
    console.error('Error parsing Bubble.io file:', error.message);
    process.exit(1);
  }
}

module.exports = { parseBubbleFile };

