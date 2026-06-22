
// Function to parse URL parameters
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        tour: params.get('tour'),
        length: params.get('length'),
        complexity: params.get('complexity'),
    };
}


function getItemsFromLocalStorage() {
    const tourData = localStorage.getItem('tourData');
    if (!tourData) {
        return null;
    }
    console.log('Tour data retrieved:', tourData);
    return JSON.parse(tourData);
}

window.getItemsFromLocalStorage = getItemsFromLocalStorage;

async function loadTourContent() {
    const tourData = localStorage.getItem('tourData');
    if (!tourData) {
        return null;
    }
    console.log('Tour data retrieved:', tourData);
    const { tourName, length, complexity } = JSON.parse(tourData);
    if (!tourName || !length || !complexity) {
        document.getElementById('item-title').textContent = 'Invalid or Missing Selection';
        document.getElementById('item-text').textContent = 'Please return to the personalization page and make a selection.';
        return;
    }

    let data;
    try {
        const response = await fetch('tour-data.json');
        if (!response.ok) {
            throw new Error(`Failed to load tour data: ${response.status}`);
        }
        data = await response.json();
    } catch (error) {
        console.error('Error fetching tour data:', error);
        document.getElementById('item-title').textContent = 'Error Loading Data';
        document.getElementById('item-text').textContent = 'There was an error retrieving the tour data. Please try again later.';
        return;
    }

    try {

        if (!data[tourName]) {
            document.getElementById('item-title').textContent = 'Tour Not Found';
            document.getElementById('item-text').textContent = 'The selected tour is not available in our data.';
            return;
        }

        const tourDataObj = data[tourName];
        const items = tourDataObj.items || [];
        const texts = tourDataObj.texts || {};
        console.log(items);

        if (items.length === 0) {
            document.getElementById('item-title').textContent = 'No Items Found';
            document.getElementById('item-text').textContent = 'The selected tour does not have any items.';
            return;
        }

        let savedIndex = localStorage.getItem('currentIndex');
        let currentIndex = savedIndex !== null ? parseInt(savedIndex, 10) : 0;
        document.getElementById('current-index').textContent = currentIndex;


        function displayItem(index, length, complexity) {
          const tourdataJson = localStorage.getItem('tourData');
          const tourdata = JSON.parse(tourdataJson);

          length = length || tourdata.length || 'short';
          complexity = complexity || tourdata.complexity || 'fun';

          const itemId = items[index];
          const itemData = texts[itemId];
          if (!itemData) {
              document.getElementById('item-title').textContent = 'Item Not Found';
              document.getElementById('item-text').textContent = 'The selected item could not be retrieved.';
              return;
          }

            document.getElementById('item-title').textContent = itemData.title || `Item ${index + 1}`;
            const itemText = itemData[complexity]?.[length] || 'No text available for this selection.';
            document.getElementById('item-text').textContent = itemText;

            const imageElement = document.getElementById('tour-image');
              if (imageElement && itemData.image) {
              imageElement.src = itemData.image;
              imageElement.alt = itemData.title || 'Tour Image';
            }

            const museumMap = document.getElementById('museum-map');
            museumMap.src = "";
            if (museumMap && itemData.maps && itemData.maps['museum-map']) {
              museumMap.src = itemData.maps['museum-map'];
              museumMap.alt = "Museum Map";
            }

            const textMuseumMap = document.getElementById('text-museum-map');
            textMuseumMap.textContent = "";
            if (textMuseumMap && itemData.maps && itemData.maps['caption-1']) {
              textMuseumMap.textContent = itemData.maps['caption-1'];
            }

            const geoMap = document.getElementById('geo-map');
            geoMap.src = "";
            if (geoMap && itemData.maps && itemData.maps['geo-map']) {
              geoMap.src = itemData.maps['geo-map'];
              geoMap.alt = "Geo Map";
            }

          const textGeoMap = document.getElementById('text-geo-map');
          textGeoMap.textContent = "";
          if (textGeoMap && itemData.maps && itemData.maps['caption-2']) {
            textGeoMap.textContent = itemData.maps['caption-2'];
          }

            const rdfFileLinkElement = document.getElementById('rdf-text-link');
             if (rdfFileLinkElement && itemData.metadata && itemData.metadata['Rdf-file_link']) {
              rdfFileLinkElement.href = itemData.metadata['Rdf-file_link'];
          }

            const rdfGraphImageElement = document.getElementById('graph-image_id');
            if (rdfGraphImageElement && itemData.metadata && itemData.metadata['Rdf-Graph_image']) {
              rdfGraphImageElement.src = itemData.metadata['Rdf-Graph_image'];
              rdfGraphImageElement.alt = `Graph for ${itemData.title}`;
          }

          const TableMetadata = document.getElementById('table-metadata');
            if (TableMetadata && itemData.metadata && itemData.metadata['Table']) {
                const tableURL = itemData.metadata['Table'];

                fetch(tableURL)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.text();
                    })
                    .then(data => {
                        console.log('Fetched table content:', data);
                        TableMetadata.innerHTML = data;
                    })
                    .catch(error => console.error('Error loading table:', error));
            } else if (TableMetadata) {
                TableMetadata.innerHTML = '<p>No table information available.</p>';
            }
        }

        displayItem(currentIndex, length, complexity);

        document.getElementById('prev').addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                localStorage.setItem('currentIndex', currentIndex);
                displayItem(currentIndex, length, complexity);
            }
        });

        document.getElementById('next').addEventListener('click', () => {
            if (currentIndex < items.length - 1) {
                currentIndex++;
                localStorage.setItem('currentIndex', currentIndex);
                displayItem(currentIndex, length, complexity);
            }
        });

        document.getElementById('length-less').addEventListener('click', () => {
          const { length, complexity } = changeLength('less');
          displayItem(currentIndex, length, complexity);
      });

      document.getElementById('length-more').addEventListener('click', () => {
          const { length, complexity } = changeLength('more');
          displayItem(currentIndex, length, complexity);
      });

      document.getElementById('complexity-less').addEventListener('click', () => {
          const { length, complexity } = changeComplexity('less');
          displayItem(currentIndex, length, complexity);
      });

      document.getElementById('complexity-more').addEventListener('click', () => {
          const { length, complexity } = changeComplexity('more');
          displayItem(currentIndex, length, complexity);
      });

      document.getElementById('timeline-button').addEventListener('click', () => {
          changeTour('Timeline Tour', 'short', 'fun');
      });
      document.getElementById('colonial-button').addEventListener('click', () => {
          changeTour('Colonial Conquests Tour', 'short', 'fun');
      });
      document.getElementById('geo-button').addEventListener('click', () => {
          changeTour('Geo Tour', 'short', 'fun');
      });

    } catch (error) {
        console.error('Error loading tour data:', error);
        document.getElementById('item-title').textContent = 'Error Loading Data';
        document.getElementById('item-text').textContent = 'There was an error retrieving the tour data. Please try again later.';
    }
}

function changeTour(tourName, length, complexity) {
  localStorage.setItem('tourData', JSON.stringify({
      tourName: tourName,
      length: length,
      complexity: complexity
  }));
  localStorage.removeItem('currentIndex');
  location.reload();
}

function changeLength(direction) {
  const tourdataJson = localStorage.getItem('tourData');
  const tourdata = JSON.parse(tourdataJson);
  if (tourdata.length === 'short' && direction === 'more') {
      tourdata.length = 'medium';
  } else if (tourdata.length === 'medium') {
      if (direction === 'more') tourdata.length = 'long';
      if (direction === 'less') tourdata.length = 'short';
  } else if (tourdata.length === 'long' && direction === 'less') {
      tourdata.length = 'medium';
  }
  localStorage.setItem('tourData', JSON.stringify(tourdata));
  return { length: tourdata.length, complexity: tourdata.complexity };
}

function changeComplexity(direction) {
  const tourdataJson = localStorage.getItem('tourData');
  const tourdata = JSON.parse(tourdataJson);
  if (tourdata.complexity === 'fun' && direction === 'more') {
      tourdata.complexity = 'basic';
  } else if (tourdata.complexity === 'basic') {
      if (direction === 'more') tourdata.complexity = 'expert';
      if (direction === 'less') tourdata.complexity = 'fun';
  } else if (tourdata.complexity === 'expert' && direction === 'less') {
      tourdata.complexity = 'basic';
  }
  localStorage.setItem('tourData', JSON.stringify(tourdata));
  return { length: tourdata.length, complexity: tourdata.complexity };
}


window.onload = async () => {
  const tourData = localStorage.getItem('tourData');

  if (!tourData) {
      localStorage.setItem('tourData', JSON.stringify({
          tourName: 'Timeline Tour',
          length: 'short',
          complexity: 'fun'
      }));
  }

  await loadTourContent();
};
