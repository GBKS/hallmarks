<template>
  <section id="use-it">
    <div class="section-intro">
      <h2>Use it</h2>
      <p>Two reference implementations ship today: TypeScript for the web and Node, Swift for iOS and macOS. Both produce byte-identical output for the same input — you can mix and match across platforms.</p>
    </div>
    <div class="install-grid">
      <div>
        <h3>TypeScript / JavaScript</h3>
<pre><code>npm install hallmarks</code></pre>
<pre><code>import { hallmark, hallmarkWords } from "hallmarks";

const node = hallmark("bc1qar0srrr7xfkvy...");
document.querySelector("#avatar").appendChild(node);

const aria = hallmarkWords("bc1qar0srrr7xfkvy...");
// → ["brush", "swarm", "always"]</code></pre>
      </div>
      <div>
        <h3>Swift</h3>
<pre><code>// Package.swift
.package(url: "https://github.com/GBKS/hallmarks", from: "1.0.0")</code></pre>
<pre><code>import Hallmarks

Hallmark(input: "bc1qar0srrr7xfkvy...")
    .frame(width: 64)</code></pre>
      </div>
    </div>
    <p style="margin-top: 22px;">Both implementations are reference implementations of <a href="/SPEC.md">the Hallmarks v1.0 specification</a>. Conformance test vectors live in <a href="/test-vectors.json">test-vectors.json</a> — any new implementation that reproduces every vector exactly is conformant.</p>
  </section>
</template>
