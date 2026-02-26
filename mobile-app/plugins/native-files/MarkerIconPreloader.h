//
//  MarkerIconPreloader.h
//  UrbanAid
//
//  Native module that pre-loads all unique marker icon images into
//  AIRGoogleMapMarker's static icon cache BEFORE any markers mount.
//  This eliminates the per-marker async RCTImageLoader pipeline for
//  cache-hit icons, enabling synchronous GMSMarker.icon assignment.
//

#import <React/RCTBridgeModule.h>

@interface MarkerIconPreloader : NSObject <RCTBridgeModule>
@end
