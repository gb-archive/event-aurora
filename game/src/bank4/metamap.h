#ifndef metamap_h
#define metamap_h

#include <gb/gb.h>

typedef struct {
    GBUInt8 * indices;
    GBUInt8 bank;
    GBUInt8 padding;
} MetamapTile;

#define metamapWidth 2
#define metamapHeight 1

extern const MetamapTile metamapTiles[metamapWidth * metamapHeight];

MetamapTile const * metamapTileAt(GBUInt8 x, GBUInt8 y);

GBBool canNavigateLeft(GBUInt8 x, GBUInt8 y);
GBBool canNavigateRight(GBUInt8 x, GBUInt8 y);
GBBool canNavigateDown(GBUInt8 x, GBUInt8 y);
GBBool canNavigateUp(GBUInt8 x, GBUInt8 y);

#endif