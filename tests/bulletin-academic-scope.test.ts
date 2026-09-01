import assert from "node:assert/strict";
import test from "node:test";

import { isAcademicBulletinCandidate } from "../src/lib/bulletin-academic-scope.js";

test("includes a university research breakthrough in an in-scope field", () => {
  assert.equal(
    isAcademicBulletinCandidate({
      title: "MIT researchers demonstrate congestion control for GPU training clusters",
      text: "The university team reports a new RDMA scheduling method for large-scale AI training.",
      source: "MIT CSAIL",
      topics: ["dc-networking", "ai-networking"],
      venue: null,
    }),
    true,
  );
});

test("includes a top conference paper in an in-scope field", () => {
  assert.equal(
    isAcademicBulletinCandidate({
      title: "NSDI paper introduces a programmable network telemetry system",
      text: "Accepted at NSDI with evaluation across cloud infrastructure workloads.",
      source: "paper",
      topics: ["network-observability"],
      venue: "NSDI",
    }),
    true,
  );
});

test("includes a relevant arXiv paper even when the institution is not in the title", () => {
  assert.equal(
    isAcademicBulletinCandidate({
      title: "Lossless collective communication for large language model training",
      text: "A preprint evaluates RDMA transport for GPU clusters.",
      source: "Academic paper: arxiv",
      topics: ["ai-networking", "dc-networking"],
      venue: null,
    }),
    true,
  );
});

test("excludes unrelated university news", () => {
  assert.equal(
    isAcademicBulletinCandidate({
      title: "University opens a new arts center",
      text: "The university announced a campus cultural initiative.",
      source: "University news",
      topics: [],
      venue: null,
    }),
    false,
  );
});
