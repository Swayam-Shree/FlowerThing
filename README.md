﻿# FlowerThing
Flower, stem and cloud generate and manipulate api to integrate with other projects.

Uses babylon.js.

Default controls:
mouse click and drag for camera pan about central point.
scroll to zoom in and out.

Manipulate the flower and lighting with values.

reference:

```color(r, g, b);```  
// This function returns an object with specified r, g, b values. Most coloring function take this as argument.  
// r, g, b go from 0 to 255. ```Float```  

```setLight(light);  ```
// sets type of light being used  
// light can take the following values:  
// "hemispheric", "point", "directional"  
// hemispheric is kinda like ambient light, best for most cases.  
// point is like a light bulb.  
// directional is like light from a source at an infinite distance, kinda like the sun.  

```setLightIntensity(intensity);  ```
// sets intensity of whole scene.  
// intensity goes from 0 to 100. ```Float```  

// col = color(r, g, b);  
```setLightDiffuseColor(col);```  
// sets flat color for the light.  
```setLightSpecularColor(col);```  
// set the color of the shine caused by the light.  
```setLightGroundColor(col);```  
// only applicable for hemispheric light, sets the color reflected by the ground.  

```Flower.createWithStem(x = randVal(-50, 50), y = randVal(-50, 50), z = randVal(-50, 50), centerDiffuseColor = color(255, 255, 0), petalDiffuseColor = color(255, 0, 0), petalCount, petalsInRow, rowHeight, petalRandomness, petalFoldMag);```  
// use to create a flower on a stem. All parameters have default values it can be called like ```Flower.createWithStem()``` too.  
// ```x```, ```y```, ```z``` are the position for the flower. ```Float```.  
// ```centerDiffuseColor``` is the color of the center cylinder. ```color(r, g, b)```  
// ```petalDiffuseColor``` is the color of all the petals. ```color(r, g, b)```  
// ```petalCount``` is the total number of petals. ```Int```.  
// ```petalsInRow``` is the number of petals in each row of the flower. ```Int```.  
// ```rowHeight``` is the distance between each row in a flower. ```Float```.  
// ```petalRandomness``` sets the angular offset of each row to give a bit more organic feel. ```Float```.  
// ```petalFoldMag``` sets how much all the petals are closed or opened. Looks best within -1 to 1 but can take any value. ```Float```.  

```Flower.createWithPlatform(x = randVal(-50, 50), y = randVal(-50, 50), z = randVal(-50, 50), centerDiffuseColor = color(255, 255, 0), petalDiffuseColor = color(255, 0, 0), platformDiffuseColor = color(0, randVal(50, 255, 0), randVal(50, 255)), platformWidth, platformHeight, platformDepth, petalCount, petalsInRow, rowHeight, petalRandomness, petalFoldMag);```  
// ```platformWidth```, ```platformHeight```, ```platformDepth``` set platform dimensions. ```Float```.

// Methods on ```Flower``` class:  
// assuming "flower" to be an instance of the class ```Flower```  
// set ```flower.petalCount```, ```flower.petalsInRow```, ```flower.rowHeight```, ```flower.petalRandomness``` according to need then call ```flower.updatePetal();```  
// set ```flower.petalFoldMag``` according to need then call ```flower.updatePetalFold()```;  
// set ```flower.platformWidth```, ```flower.platformHeight```, ```flower.platformDepth``` according to need then call ```flower.updatePlatform();```  
// ```flower.setPosition(x, y, z);``` x, y, z are ```Float```.  
// ```flower.setPetalDiffuseColor(col);``` col is ```color(r, g, b);```  
// ```flower.setCenterDiffuseColor(col);``` col is ```color(r, g, b);```  
// ```flower.setPlatformDiffuseColor(col);``` col is ```color(r, g, b);```  
// ```flower.dispose()``` removes flower from screen and frees up all occupied memory.  
