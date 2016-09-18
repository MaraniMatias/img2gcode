;---> this code is for cnc-ino <---
G21 ; Set units to mm
G90 ; Absolute positioning
; /home/marani/node_js/img-to-GCode/tests/img-and-gcode/test.jpeg
; /home/marani/node_js/img-to-GCode/tests/img-and-gcode/test.gcode
; Img Size: (700,700)pixel to (700,700)mm
; Process Error: 0
; Tool Diameter: 1
; Scale Axes: 700
; Deep Step: -1
; Z Save: 1
; Z White: 0
; Z Black: -1
G01 X0 Y-0 Z1; X0 Y0 Z1 Line Init
G01 X1.5 Y-1.5 Z1; With Z max 
G01 X1.5 Y-1.5 Z-1
G01 X2.5 Y-1.5 Z-1
G01 X1.5 Y-1.5 Z-1
G01 X1.5 Y-2.5 Z-1
G01 Z1
G01 X1.5 Y-4.5 Z1
G01 Z-1
G01 X1.5 Y-5.5 Z-1
G01 X1.5 Y-6.5 Z-1
G01 Z1
G01 X2.5 Y-2.5 Z1
G01 Z-1
G01 Z1
G01 X2.5 Y-4.5 Z1
G01 Z-1
G01 X2.5 Y-5.5 Z-1
G01 X2.5 Y-6.5 Z-1
G01 X2.5 Y-6.5 Z1; With new deep step
G01 Z1; With Z max