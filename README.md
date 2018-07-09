# Nifty Crop Mover
A Xsplit Extension for advance Item copping flexibility

## Introduction
Given an Item on the XSplit stage that has been cropped to fit a layout, this extension allows you to move and scale the Item without moving its frame.
### Example
Without Nifty Crop | With Nifty crop
-------------------|--------------
![Before](media/crop-demo-before.gif)|![After](media/crop-demo-after.gif)

## Installation
1. Download or clone this repo to your local computer
2. Open XSplit
3. Go to Extensions -> Add custom extension...
4. In the Add Extension window, click browse, navigate to the Nifty Crop Mover folder and select index.html
5. Click Ok
6. In the Extensions menu, there should now be a `Nifty Crop Mover` menu item. Select that item to start the extension.

## Usage

To use the extension, simply select an Item by clicking on it on the stage or in the sources list. The extension should display the current frame of the Item in green, with the area of the item that is currently cropped shown in grey. Click and drag anywhere in the grey box to change the Item cropping. Click and drag on any of the four corner squares to scale the item (scaling is always proportional). You cannot move or scale the item to be smaller the frame. The Extension should also take into account if the Item has been rotated on the Z axis (2d rotation). It *does not* currently account for X/Y axis (3D) rotation or horizonal/vertical flipping.

Note: Due to how the XSplit API triggers events, the representation of a source in the Nifty Crop extension window will not automatically update to reflect changes to the Item done directly on the XSplit stage (moving, resizing, cropping, etc). To update the Nifty Crop extension, simply reselect the Item (by selecting something else and then selecting the Item again)

### Extra Features
##### Precise Movement
Since the Crop Mover window is smaller then the XSplit stage, 1px of mouse drag translates into a larger movement of the Item on the Stage. Hold down the `ctrl` key to switch to 1:1 movement of the Item and the mouse.

##### Oversized Items
If you scale an item past its native resolution, it will turn red to indicate that the image quality may be degraded

##### Alternate Item Selection
In addition to selecting an item in the main XSplit window, you can also manually override the current Item by using the Drop Down menu at the bottom of the extension window. This is useful if you want to adjust the cropping of an item on a different scene without switching to that scene (if you have projected that scene onto a separate monitor, for example)

##### Selecting an item in the Preview Editor
The XSplit API *does not* register Item selections in the Preview Editor. In order to adjust the cropping of an Item in the Preview Editor, open the preview and then click the reload arrow beside the Item Selection menu at the bottom of the extension window. Open the Item Selection menu and you should see a new **Preview** scene listed at the top.
