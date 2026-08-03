# Milk & Bean — Café Infrastructure

A café's website, moved off a USB stick and onto real, globally-reachable infrastructure on AWS.

**Live at:** [milkandbean.store](https://milkandbean.store)

---

## What this is

Milk & Bean had a website that lived on a USB stick — no server, no way to receive a request, so no way for anyone but the owner to ever see it. This repo is that same site, now running on infrastructure that's always listening, reachable by a real domain name, served securely, and priced for what it actually needs.

## Architecture

```
Visitor
  │
  ▼
milkandbean.store  (Route 53 — DNS)
  │
  ▼
CloudFront  (CDN — HTTPS, global edge caching)
  │
  ▼
S3 bucket  (storage — the actual HTML/CSS/JS files)
```

## What's running here, and why

### S3 — file storage, not a server
The site is **static**: the same HTML/CSS/JS gets sent to every visitor, nothing is computed per request. That means it doesn't need a computer running around the clock to serve it — S3 just stores the files and hands them back on request. There's no idle process sitting there waiting for traffic 24/7, which is exactly why this is cheaper than keeping an EC2 instance running (see [Cost](#cost) below). S3 lives in a single AWS region (`eu-north-1`) — it is *not* itself globally distributed; that job belongs to CloudFront, below.

### CloudFront — CDN in front of S3
Before CloudFront, the site was served from one region only, which meant a real, felt problem: **slow load times for visitors far from that region**. CloudFront fixes that by caching copies of the site at edge locations physically closer to visitors worldwide, so a request doesn't have to round-trip to a single origin every time. It's also the piece in this stack that makes two other things possible: **free HTTPS** (via an ACM certificate) and a **custom domain** — S3 alone can offer neither.

### Route 53 — the real domain
A free dynamic DNS service (DuckDNS) was used early on, but it only supports plain **A records** — name pointed straight at a fixed IP address. To point a domain at CloudFront, the domain needs an **Alias record**, which resolves to CloudFront's hostname rather than a fixed IP (CloudFront's edge IPs aren't fixed or predictable). DuckDNS can't do that; Route 53 can. Buying a real domain and using Route 53 was the trade-off required to get a stable custom domain in front of a CDN.

### IAM — getting off the root user
The AWS account was originally accessed as the root user, which has **unlimited privilege with no restrictions** — any mistake, leaked credential, or successful attack has no ceiling, and billing exposure is the sharpest version of that risk. The fix was creating a scoped IAM user with only the specific service permissions this project actually needs (EC2, S3, CloudFront, Route 53, ACM), and using that day-to-day instead. Billing visibility itself stays locked down separately by default, even for a broadly-permissioned IAM user — it has to be explicitly enabled by the root account owner.

## Cost

| | Before (EC2, always-on) | After (S3 + CloudFront) |
|---|---|---|
| Monthly cost | ~$8.63 | $0 |

The EC2 instance was billing whether or not anyone visited the site. S3 and CloudFront's free tier cover this project's actual traffic. The EC2 instance was **terminated**, not just stopped — a stopped instance still bills for its attached EBS storage until it's fully terminated.

## What I'd do differently

**1. Conflating S3 and CloudFront's jobs.**
Early on, the assumption was that S3 itself was "distributed globally across multiple servers." It isn't — S3 lives in one region. What's globally distributed is CloudFront's edge cache, sitting *in front of* S3. Easy to blur because they get wired together in the same request path, but they're doing genuinely different jobs: S3 stores, CloudFront distributes and caches.

**2. Assuming CloudFront's setup was what created the domain's nameservers.**
The real sequence: creating the **Route 53 hosted zone** generates 4 nameservers on its own, entirely independent of S3 or CloudFront. Pointing the domain registrar (Namecheap) at those nameservers is what hands DNS authority to AWS. CloudFront gets *attached* to the domain afterward — it doesn't generate any part of the DNS setup itself.

**3. A wrong cost figure picked up mid-research.**
A $51/year number got grabbed while browsing AWS pricing, but it turned out to be an unrelated Savings Plan quote — not the actual on-demand cost of this instance. The real number came from the public EC2 pricing page, filtered by instance type and region directly, with no billing console access needed. Lesson: pricing pages have a lot of adjacent numbers on them: confirm the number matches the exact instance type, region, and pricing model before trusting it.

---
*Part of the [DevOps Career Simulator](../../devops-career-simulator) — Project 01 of 12.*
