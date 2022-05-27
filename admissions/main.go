package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"flag"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/peterbourgon/ff/v3"

	"github.com/snyk/sweater-comb/admissions/internal/mutate"
)

func handleRoot(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("OK"))
}

func handleMutate(w http.ResponseWriter, r *http.Request) {
	// read the body / request
	body, err := ioutil.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		log.Printf("failed to read request body: %v", err)
		http.Error(w, "server error", http.StatusInternalServerError)
		return
	}

	// mutate the request
	mutated, err := mutate.Mutate(body, *verbose)
	if err != nil {
		log.Printf("mutate failed: %v", err)
		http.Error(w, "server error", http.StatusInternalServerError)
		return
	}

	// and write it back
	w.WriteHeader(http.StatusOK)
	w.Write(mutated)
}

var (
	tlsKey  = flag.String("key", "/pki/tls.key", "TLS server key")
	tlsCrt  = flag.String("crt", "/pki/tls.crt", "TLS server cert")
	caCrt   = flag.String("cacrt", "/pki/root/ca.crt", "Client root CA certificate")
	addr    = flag.String("addr", ":8443", "TLS listen address")
	verbose = flag.Bool("verbose", false, "verbose logging")
)

func main() {
	err := ff.Parse(flag.CommandLine, os.Args[1:], ff.WithEnvVarNoPrefix())
	if err != nil {
		log.Fatalf("failed to parse options: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", handleRoot)
	mux.HandleFunc("/mutate", handleMutate)

	serverCert, err := tls.LoadX509KeyPair(*tlsCrt, *tlsKey)
	if err != nil {
		log.Fatalf("failed to load server certificate and key: %v", err)
	}

	clientRoots, err := x509.SystemCertPool()
	if err != nil {
		log.Fatal(err)
	}
	caCrtBytes, err := os.ReadFile(*caCrt)
	if err != nil {
		log.Fatalf("failed to read %q: %v", *caCrt, err)
	}
	clientRoots.AppendCertsFromPEM(caCrtBytes)

	l, err := tls.Listen("tcp", *addr, &tls.Config{
		Certificates: []tls.Certificate{serverCert},
		//ClientAuth:   tls.RequestClientCert,
		ClientCAs: clientRoots,
	})
	if err != nil {
		log.Fatalf("listen failed: %v", err)
	}

	srv := &http.Server{
		Addr:           *addr,
		Handler:        mux,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1048576
	}
	shutdownComplete := make(chan struct{})

	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, os.Interrupt)
		signal.Notify(sigCh, syscall.SIGTERM)
		<-sigCh

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("server shutdown failed: %v", err)
		}
		close(shutdownComplete)
	}()

	if err := srv.Serve(l); err != http.ErrServerClosed {
		log.Fatalf("server failed: %v", err)
	}
	<-shutdownComplete
}
