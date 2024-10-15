console.log(campground2.geometry.coordinates);
      //campground2 and maptilerApiKey aare being declared in show.ejs
      maptilersdk.config.apiKey = maptilerApiKey;
      const map = new maptilersdk.Map({
          container: 'map',
          style: maptilersdk.MapStyle.BRIGHT,
          center: campground2.geometry.coordinates, // starting position [lng, lat]
          zoom: 10 // starting zoom
      });

      

      new maptilersdk.Marker()
          .setLngLat(campground2.geometry.coordinates)
          .setPopup(
              new maptilersdk.Popup({ offset: 25 })
                  .setHTML(
                      `<h3>${campground2.title}</h3><p>${campground2.location}</p>`
                  )
          )
          .addTo(map)