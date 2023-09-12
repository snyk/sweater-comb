{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        lastMod = self.lastModifiedDate or self.lastModified or "19700101";
      in rec {
        devShells.default = pkgs.mkShell { packages = with pkgs; [ nodejs ]; };
        packages.default = pkgs.buildNpmPackage rec {
          pname = "sweater-comb";
          version = builtins.substring 0 8 lastMod;
          src = ./.;
          npmDepsHash = "sha256-JVaL/N3hcTLc8kJZXZ9eKGxvgPuUO6VuJN4ZanOdApc=";
          nativeBuildInputs = [ pkgs.nodePackages.node-gyp pkgs.python3 ];
          npmBuildScript = "build";
          meta = { 
            mainProgram = "@snyk/sweater-comb"; 
            description = "OpenAPI linting rules for Snyk APIs";
            homepage = "https://github.com/snyk/sweater-comb";
            platforms = flake-utils.lib.defaultSystems;
          };
        };
      });
}
