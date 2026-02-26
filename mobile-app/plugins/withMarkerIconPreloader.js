/**
 * Expo Config Plugin: MarkerIconPreloader Native Module
 *
 * Copies the custom MarkerIconPreloader Obj-C files into the iOS project
 * during `expo prebuild`. This ensures the native module that pre-populates
 * AIRGoogleMapMarker's _iconCache survives `prebuild --clean`.
 */
const { withXcodeProject } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NATIVE_FILES = ['MarkerIconPreloader.h', 'MarkerIconPreloader.m'];

module.exports = function withMarkerIconPreloader(config) {
  return withXcodeProject(config, (xcodeConfig) => {
    const project = xcodeConfig.modResults;
    const projectName = xcodeConfig.modRequest.projectName;
    const sourceDir = path.join(__dirname, 'native-files');
    const targetDir = path.join(
      xcodeConfig.modRequest.platformProjectRoot,
      projectName
    );

    for (const fileName of NATIVE_FILES) {
      const src = path.join(sourceDir, fileName);
      const dest = path.join(targetDir, fileName);

      // Copy file into ios/UrbanAid/
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }

      // Add to Xcode project if not already there
      if (!project.hasFile(fileName)) {
        project.addSourceFile(
          `${projectName}/${fileName}`,
          null,
          project.findPBXGroupKey({ name: projectName })
        );
      }
    }

    return xcodeConfig;
  });
};
