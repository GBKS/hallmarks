// swift-tools-version: 5.9
//
// Hallmarks — deterministic visual marks for verifying identifiers.
// Reference SwiftUI implementation of Hallmarks v1.0.
//
// Site: https://hallmarks.info
// Spec: SPEC.md (CC0 1.0)
// Code: MIT — see LICENSE

import PackageDescription

let package = Package(
    name: "Hallmarks",
    platforms: [
        .iOS(.v15),
        .macOS(.v12),
        .tvOS(.v15),
        .watchOS(.v8),
        .visionOS(.v1),
    ],
    products: [
        .library(
            name: "Hallmarks",
            targets: ["Hallmarks"]
        ),
    ],
    targets: [
        .target(
            name: "Hallmarks",
            path: "Sources/Hallmarks"
        ),
    ]
)
