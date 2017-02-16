# ImageSlider v1.0.0
#### Simple non jquery Image slider template

## Installation
#### Step 1 : Download file and link required files
First, you need to download custom.js and main.css files from this site.
Next, link javascript and css file.
```HTML
<link rel="stylesheet" href="common/css/imageSlider.css" />
<script src="common/js/imageSlider.js" /></script>
```
#### Step2 : Create HTML Markup
Create a ```<div class="effect-wrapper">``` element, width a ```<img>``` element for each slide.
```HTML
<div id="test" class="effect-wrapper">
    <img class="active" src="common/images/sky01.jpg">
    <img src="common/images/sky02.jpg">
    <img src="common/images/sky03.jpg">
    <img src="common/images/sky05.jpg">
    <img src="common/images/sky04.jpg">
</div>
```
#### Step3 : Create ImageEffect instance
Create a instance of imageEffect to initialize and make it work it.
```javascript
var effects = new imageEffect({
    selector     : '#test',
    showTime     : 5000,
    interval     : 20,
    step         : 1,
    acceleration : 1,
    autoResize   : true,
    func         : ['shutfadein', 'fadeintocenter'],
});
```
## Configuration options
**Selector**  ID or Class to select image slide wrapper
```javascript
selector : '#id'
selector : '.class'
```
**ShowTime** Time to show until next slide image
```javascript
showTime : 5000
showTime : [1000, 30000, 100]
```
**interval** Interval for next drawing
```javascript
interval : 20
```
**Step** Amount of movement per drawing (1 - 100)
```javascript
step : 1
```
**Acceleration** Variable to change interval at runtime
```javascript
acceleration : 1 (default)
acceleration : 0.5
acceleration : 1.5
```
**autoResize** Variable to set if you want auto resizing for images
```javascript
autoResize : true
autoResize : false
```
**Func** Name of effect function
```javascript
func : 'fadeIn'
func : ['fadeIn, 'modalin']
```
