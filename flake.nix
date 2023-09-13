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

          npmDepsHash = "sha256-ljVq4otWSn7oRlUrSqzIXDKDDNGBrG1oMnz+Uf+pzeE=";
          npmBuildScript = "build";

          nativeBuildInputs = [ pkgs.nodePackages.node-gyp pkgs.python3 ];

          postInstall = ''
            mv $out/bin/@snyk/sweater-comb $out/bin
            rmdir $out/bin/@snyk
          '';

          meta = { 
            description = "OpenAPI linting rules for Snyk APIs";
            homepage = "https://github.com/snyk/sweater-comb";
            platforms = flake-utils.lib.defaultSystems;
          };
        };
      });
}
