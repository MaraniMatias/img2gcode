;---> this code is for cnc-ino <---
G21 ; Set units to mm
G90 ; Absolute positioning
; /home/marani/Documentos/img-to-GCode/img/test.png
; ./img/test.gcode
; Img Size: 40,40
; Tool Diameter: 2
; Scale Axes: 40
; Deep Step: -1
; Z Save: 2
; Z White: 0
; Z Black: -2
G01 X0 Y0 Z2; X0 Y0 Z2 Line Init
G01 X16 Y16 Z2; With Z max 
G01 X16 Y16 Z0
G01 X16 Y16 Z0
G01 Z2
G01 X16 Y24 Z2
G01 Z0
G01 X16 Y24 Z0
G01 Z2
G01 X24 Y16 Z2
G01 Z0
G01 X24 Y16 Z0
G01 Z2
G01 X24 Y24 Z2
G01 Z0
G01 X24 Y24 Z0
G01 X24 Y24 Z2; With new deep step
G01 X0 Y0 Z2; X0 Y0 Z2 Line Init
G01 X16 Y16 Z2; With Z max 
G01 X16 Y16 Z-1
G01 X16 Y16 Z-1
G01 Z2
G01 X16 Y24 Z2
G01 Z-1
G01 X16 Y24 Z-1
G01 Z2
G01 X24 Y16 Z2
G01 Z-1
G01 X24 Y16 Z-1
G01 Z2
G01 X24 Y24 Z2
G01 Z-1
G01 X24 Y24 Z-1
G01 X24 Y24 Z2; With new deep step
G01 X0 Y0 Z2; X0 Y0 Z2 Line Init
G01 X16 Y16 Z2; With Z max 
G01 X16 Y16 Z-2
G01 X16 Y16 Z-2
G01 Z2
G01 X16 Y24 Z2
G01 Z-2
G01 X16 Y24 Z-2
G01 Z2
G01 X24 Y16 Z2
G01 Z-2
G01 X24 Y16 Z-2
G01 Z2
G01 X24 Y24 Z2
G01 Z-2
G01 X24 Y24 Z-2
G01 X24 Y24 Z2; With new deep step
G01 Z2; With Z max