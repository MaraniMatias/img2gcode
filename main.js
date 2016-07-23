// + x X
// y 
// Y 
// intencidad 0 -> 765
const Pixel = require("pixel-class");
const lwip = require('lwip');
const deffy = require("deffy");

// obtain an image object:
lwip.open('./img/rbgw.png', function(err, image){
  console.log(image.getPixel(0,0));
  console.log('0,0',new Pixel(image.getPixel(0,0)),new Pixel(image.getPixel(0,0)).intensity() );
  
  console.log(image.getPixel(2,0));
  console.log('2,0',new Pixel(image.getPixel(2,0)),new Pixel(image.getPixel(2,0)).intensity() );

  console.log(image.getPixel(2,1));
  console.log('1,2',new Pixel(image.getPixel(2,1)),new Pixel(image.getPixel(2,1)).intensity() );
});


function getPixels (image) {
    let pixels = []
      , height = image.height()
      , width = image.width()
      , row = []
      ;
    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            row.push(new Pixel(image.getPixel(x, y)));
        }
        pixels.push(cRow);
        cRow = [];
    }
    return pixels;
};

function  intensity (pixel) {
  if (pixel.a > 1) {
    pixel.a /= 100;
  }
  pixel.a = deffy(pixel.a, 1);
  return (pixel.r + pixel.g + pixel.b) * pixel.a;
}