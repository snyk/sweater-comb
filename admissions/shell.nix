let
  pkgs = import <nixpkgs> {};
  unstable = import <nixpkgs-unstable> {};

  shell = pkgs.mkShell {
    nativeBuildInputs = with pkgs.buildPackages; [
      unstable.go_1_18
    ];
    shellHook = ''
        export TMPDIR=~/.local/tmp
        mkdir -p $TMPDIR
        export GOPATH="$HOME/.cache/gopaths/$(sha256sum <<<$(pwd) | awk '{print $1}')"
    '';
  };
in shell
