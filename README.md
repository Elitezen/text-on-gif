*text-on-gif is a simple package for writing and animating text on animated as well as non-animated gifs*

> **NOTES**
>* TRANSPARENT GIFS WONT WORK AS EXPECTED (Plan on fixing it later)
>* WILL SUPPORT CUSTOM FONTS FROM NEXT UPDATE

**Basic Usage**
```js
    const TextOnGif = require('text-on-gif');

    (async function(){

        //create a TextOnGif object
        var gif = new TextOnGif({
          file_path: "https://media0.giphy.com/media/kFgzrTt798d2w/giphy.gif"
        });

        //get as buffer
        var buffer = await gif.textOnGif({
            text: "text on gif sucks",
            get_as_buffer: true
        });

        console.log(buffer);

        //write as file
        await gif.textOnGif({
            text: "text on gif sucks",
            get_as_buffer: false,
            write_path: "gif-with-text.gif"
        });

    })();
```

# Example
![GitHub Logo](https://i.postimg.cc/gJrq1rjJ/gif-with-text.gif)
#
## TextOnGif Constructor Parameters
Parameter Name               | Type   | Default Value
---------------------------- | ------ | -------
[file_path](#filepath)       | String | null
[font_size](#fontsize)       | String | "32px"
[font_style](#fontstyle)     | String | "calibri"
[font_color](#fontcolor)     | String | "white"
[stroke_color](#strokecolor) | String | "transparent"
[stroke_width](#strokewidth) | Int    | 1
[alignment_x](#alignment)    | String | "middle"
[alignment_y](#alignment)    | String | "bottom"
[position_x](#positionx)     | Int    | null
[position_y](#positiony)     | Int    | null
[offset_x](#offsetx)         | Int    | 10
[offset_y](#offsety)         | Int    | 10
[row_gap](#rowgap)           | Int    | 5
[repeat](#rowgap)            | Int    | 0
&nbsp;  

### [read mode about these properties ▶](#writepath)

&nbsp;

# To Write Text On Gif
**make a new TextOnGif object then call its member function textOnGif**

## Example:  

```js
    var gif = new TextOnGif({
        file_path: "path/to/gif.gif"
    });

    var buffer = await gif.textOnGif({
        text: "Yo this readme sick :D",
    });
```

## textOnGif Function Parameters:
Parameter Name                | Type    | Default Value
----------------------------- | ------- | -------
[text](#text)                 | String  | ""
[get_as_buffer](#getasbuffer) | Boolean | true
[write_path](#writepath)      | String  | null
&nbsp;  

# text

Text to be printed on the gif, must be a String, Number or Boolean.

&nbsp;

# get_as_buffer

Whether to return the gif as a buffer or not after printing the message on it. 

_**Set to false if buffer is not needed** to speed up printing of text on gif_

&nbsp;

# write_path

Path of the file where the gif is to be written.

*Example:*
```js
    await gif.textOnGif({
        text: "huihuihui",
        get_as_buffer: false, // set to false to speed up the process as gif is piped instead
        write_path: "gif-with-text.gif"
    });
```

**Gif will only be written to file if value of write_path is passed**


&nbsp;

# file_path
Gif on which the text is to be printed,
___path to a local gif file___ or ___URL___

&nbsp;

# font_size
Size of font, any [CSS font-size value](https://developer.mozilla.org/en-US/docs/Web/CSS/font-size)

*Invalid values might break [font_style](#fontstyle) and [font_color](#fontcolor) too and result inna very ugly output*

&nbsp;

# font_style
Any installed font. Example: (font_style: "Comic Sans MS")

*Invalid values might break [font_size](#fontsize) and [font_color](#fontcolor) too and result inna very ugly output*

&nbsp;

# font_color
Color of the font. Accepts any [CSS Color](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value).

*Invalid values might break [font_size](#fontsize) and [font_style](#fontstyle) too and result inna very ugly output*


&nbsp;

# stroke_color
Color of the stroke, leave as "transparent" for no stroke. Accepts any [CSS Color](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value).

&nbsp;

# stroke_width
Number specifying the line width(Outline) of drawn text, in 'coordinate space units'

&nbsp;

# alignment
### valid values for Hozizontal Alignmen (*alignment_x*)
* "left"
* "center"
* "right"
### valid values for Vertical Alignment (*alignment_y*)
* "top"
* "middle"
* "bottom"

&nbsp;

# position_x
Starting position of text on the x axis(in pixels), *must be a Number*

&nbsp;

# position_y
Starting position of text on the y axis(in pixels), *must be a Number*

&nbsp;

# offset_x
Offset of starting position of text from left or right(in pixels) depending on alignment_x, *must be a Number*  

*not taken into account if position_x is specified* 

&nbsp;

# offset_y
Offset of starting position of text from Top or Bottom(in pixels) depending on alignment_y, *must be a Number*  

*not taken into account if position_y is specified* 

&nbsp;

# row_gap
Vertical gap between rows of text(in pixels)

*taken into account when text to be printed is too long for one row and is wrapped to the next row* 

&nbsp;

# repeat
Number of times to repeat the GIF, *n Number*
* If n is -1, play once.  
* If n is 0, loop indefinitely. 
* If n is a positive number, loop n times.

&nbsp;




