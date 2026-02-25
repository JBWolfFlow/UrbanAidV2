//
//  MarkerIconPreloader.m
//  UrbanAid
//
//  Loads all unique marker icon URIs into AIRGoogleMapMarker's static
//  icon cache via RCTImageLoader. Called once from JS before markers
//  mount. After this completes, every setIconSrc: call is a synchronous
//  cache hit — no async dispatch, no GCD thread hops, no trickle.
//
//  Uses NSClassFromString to access AIRGoogleMapMarker.iconCache at
//  runtime, avoiding compile-time header dependency on the pod target.
//

#import "MarkerIconPreloader.h"
#import <React/RCTImageLoaderProtocol.h>
#import <React/RCTConvert.h>
#import <React/RCTUtils.h>

@implementation MarkerIconPreloader

RCT_EXPORT_MODULE();

@synthesize moduleRegistry = _moduleRegistry;

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

RCT_EXPORT_METHOD(preloadIcons:(NSArray<NSString *> *)urls
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // Resolve AIRGoogleMapMarker class at runtime (lives in react-native-maps pod)
  Class markerClass = NSClassFromString(@"AIRGoogleMapMarker");
  NSMutableDictionary *cache = nil;
  if (markerClass && [markerClass respondsToSelector:@selector(iconCache)]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
    cache = [markerClass performSelector:@selector(iconCache)];
#pragma clang diagnostic pop
  }

  if (!cache) {
    NSLog(@"[MarkerIconPreloader] WARNING: AIRGoogleMapMarker.iconCache not available");
    resolve(@{ @"loaded": @(0), @"total": @(urls.count) });
    return;
  }

  // Get ImageLoader via moduleRegistry (works on both Bridge and Fabric)
  id<RCTImageLoaderProtocol> imageLoader = (id<RCTImageLoaderProtocol>)[self.moduleRegistry moduleForName:"ImageLoader"];

  if (!imageLoader) {
    NSLog(@"[MarkerIconPreloader] WARNING: ImageLoader not available via moduleRegistry");
    resolve(@{ @"loaded": @(0), @"total": @(urls.count) });
    return;
  }

  dispatch_group_t group = dispatch_group_create();
  __block NSInteger successCount = 0;

  for (NSString *url in urls) {
    dispatch_group_enter(group);

    [imageLoader loadImageWithURLRequest:[RCTConvert NSURLRequest:url]
      size:CGSizeZero
      scale:RCTScreenScale()
      clipped:NO
      resizeMode:RCTResizeModeContain
      progressBlock:nil
      partialLoadBlock:nil
      completionBlock:^(NSError *error, UIImage *image) {
        if (image) {
          dispatch_async(dispatch_get_main_queue(), ^{
            cache[url] = image;
            successCount++;
            dispatch_group_leave(group);
          });
        } else {
          if (error) {
            NSLog(@"[MarkerIconPreloader] Failed to load %@: %@", url, error);
          }
          dispatch_group_leave(group);
        }
      }];
  }

  dispatch_group_notify(group, dispatch_get_main_queue(), ^{
    resolve(@{ @"loaded": @(successCount), @"total": @(urls.count) });
  });
}

@end
