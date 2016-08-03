G21 ; Set units to mm
G90 ; Absolute positioning
G01 X0 Y0 Z765; con Z max
G01 X0 Y0 Z0; ---> pixel start <---
G01 X0 Y1 Z0
G01 X1 Y1 Z0
G01 X1 Y0 Z0
G01 X1 Y0 Z765
G01 Z765; ---> this code is for cnc-ino <---