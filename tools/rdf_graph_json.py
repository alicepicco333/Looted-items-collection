"""Turn each object's RDF/XML file into a graph for the 3D metadata viewer (graph3d.js).

    python tools/rdf_graph_json.py

Reads the RDF file named in tour-data.json for every object, parses it with rdflib (which
also checks that it is valid RDF/XML) and writes graphs/NN.json:

    {"no": 5, "rdf": "rdf_files_graphs/....rdf", "triples": 42,
     "nodes": [{"id", "label", "kind": "root"|"resource"|"literal", "classes": [...], "uri", "x", "y", "z"}],
     "links": [{"source", "target", "label", "predicate"}]}

Positions are computed here (networkx spring layout in 3D, seeded, so the graph looks the
same every time) and the browser only draws them. rdfs:label and rdf:type are folded into
the nodes (label, classes) instead of being drawn as edges.
"""
import json, os, urllib.parse
import rdflib
from rdflib import Literal
from rdflib.namespace import RDFS, RDF, DC, DCTERMS
import networkx as nx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "graphs")


def local(uri):
    s = str(uri).rstrip("/")
    for sep in ("#", "/"):
        if sep in s:
            s = s.rsplit(sep, 1)[1] or s
    return urllib.parse.unquote(s)


def build(no, path):
    g = rdflib.Graph()
    g.parse(path, format="xml")
    labels = {s: str(o) for s, o in g.subject_objects(RDFS.label)}
    # objects without rdfs:label: use their title
    for prop in (DC.title, DCTERMS.title):
        for s_, o in g.subject_objects(prop):
            labels.setdefault(s_, str(o))

    def readable(term):
        # names for identifiers that have no label in the file
        u = str(term).rstrip("/")
        if "wikidata.org" in u: return f"Wikidata {local(u)}"
        if "geonames.org" in u: return f"GeoNames {local(u)}"
        if "openstreetmap.org" in u: return f"OpenStreetMap {local(u)}"
        if "viaf.org" in u: return f"VIAF {local(u)}"
        return local(u).replace("_", " ")
    classes = {}
    for s, o in g.subject_objects(RDF.type):
        classes.setdefault(s, []).append(local(o))
    nodes, links = {}, []

    def node(term, i=None):
        if isinstance(term, Literal):
            nid = f"lit{i}"
            text = str(term)
            nodes[nid] = {"id": nid, "label": text if len(text) <= 160 else text[:157] + "…", "kind": "literal", "classes": [], "uri": None}
        else:
            nid = str(term)
            if nid not in nodes:
                nodes[nid] = {"id": nid, "label": labels.get(term) or readable(term), "kind": "resource", "classes": classes.get(term, []),
                              "uri": nid if nid.startswith("http") else None}
        return nid

    for i, (s, p, o) in enumerate(sorted(g)):
        if p in (RDFS.label, RDF.type):
            continue
        a, b = node(s), node(o, i)
        links.append({"source": a, "target": b, "label": local(p), "predicate": str(p)})

    G = nx.Graph()
    G.add_nodes_from(nodes)
    G.add_edges_from((l["source"], l["target"]) for l in links)
    root = max(nodes, key=lambda n: sum(1 for l in links if l["source"] == n))
    nodes[root]["kind"] = "root"
    pos = nx.spring_layout(G, dim=3, seed=7, k=1.6 / max(len(G) ** 0.5, 1), iterations=200)
    c = pos[root]
    for n, (x, y, z) in pos.items():
        nodes[n].update(x=round(float(x - c[0]), 4), y=round(float(y - c[1]), 4), z=round(float(z - c[2]), 4))
    return {"no": no, "rdf": os.path.relpath(path, ROOT).replace("\\", "/"), "triples": len(g), "nodes": list(nodes.values()), "links": links}


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    tours = json.load(open(os.path.join(ROOT, "tour-data.json"), encoding="utf8"))
    done = set()
    for it in tours["Timeline Tour"]["texts"].values():
        name = urllib.parse.unquote(os.path.basename(it["metadata"]["Rdf-file_link"]))
        no = int(name.split("_")[0])
        path = os.path.join(ROOT, "rdf_files_graphs", name)
        if not os.path.exists(path):
            # a few older files have slightly different names locally
            cands = [f for f in os.listdir(os.path.join(ROOT, "rdf_files_graphs")) if f.startswith(f"{no}_") and f.endswith(".rdf")]
            path = os.path.join(ROOT, "rdf_files_graphs", cands[0])
        data = build(no, path)
        json.dump(data, open(os.path.join(OUT, f"{no:02d}.json"), "w", encoding="utf8", newline="\n"), ensure_ascii=False, separators=(",", ":"))
        done.add(no)
        print(f"{no:02d} {len(data['nodes'])} nodes, {len(data['links'])} links  <- {os.path.basename(path)}")
    print(len(done), "graphs")
