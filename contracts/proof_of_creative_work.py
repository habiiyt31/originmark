# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from dataclasses import dataclass
import json


@allow_storage
@dataclass
class IPRecord:
    cert_id:          u256
    creator:          Address
    title:            str
    description:      str
    media_type:       str
    source_url:       str
    creativity_score: u256
    license_fee:      u256
    total_royalties:  u256
    is_active:        bool


@allow_storage
@dataclass
class DisputeRecord:
    dispute_id:  u256
    claimant:    Address
    cert_id:     u256
    suspect_url: str
    bond:        u256
    verdict:     str
    confidence:  u256
    reasoning:   str
    resolved:    bool


@gl.evm.contract_interface
class _EOA:
    class View:
        pass
    class Write:
        pass


class ProofOfCreativeWork(gl.Contract):

    works:            DynArray[IPRecord]
    disputes:         DynArray[DisputeRecord]
    work_count:       u256
    dispute_count:    u256
    owner:            Address
    reg_fee:          u256
    dispute_bond:     u256
    platform_bps:     u256
    platform_balance: u256

    def __init__(self):
        self.owner            = gl.message.sender_address
        self.reg_fee          = u256(10_000_000_000_000_000)
        self.dispute_bond     = u256(50_000_000_000_000_000)
        self.platform_bps     = u256(500)
        self.platform_balance = u256(0)

    def _platform_cut(self, amount: u256) -> u256:
        return (amount * self.platform_bps) // u256(10_000)

    @gl.public.write.payable
    def register_work(
        self,
        title:       str,
        description: str,
        media_type:  str,
        source_url:  str,
        license_fee: u256,
    ) -> str:
        creator = gl.message.sender_address
        paid    = gl.message.value

        assert paid >= self.reg_fee, "Registration fee 0.01 GEN required"
        assert len(title.strip()) >= 3, "Title too short (min 3 chars)"
        assert len(description.strip()) >= 20, "Description too short (min 20 chars)"
        assert media_type in ("image", "music", "text", "video", "other"), "Invalid media_type"
        assert len(source_url.strip()) >= 8, "Source URL required"

        existing_titles = ""
        for i in range(int(self.work_count)):
            r = self.works[i]
            if r.is_active:
                existing_titles = existing_titles + "- " + str(r.title) + "\n"
        if existing_titles == "":
            existing_titles = "(none yet)"

        title_val  = title
        desc_val   = description
        mtype_val  = media_type

        def judge_originality() -> str:
            prompt = (
                "You are an IP registration judge on a blockchain.\n\n"
                "New work submitted:\n"
                "- Title: " + title_val + "\n"
                "- Description: " + desc_val + "\n"
                "- Type: " + mtype_val + "\n\n"
                "Already registered works:\n" + existing_titles + "\n"
                "Rules:\n"
                "1. REJECT if title and description are extremely similar to an existing work\n"
                "2. REJECT if description is empty or has zero creative content\n"
                "3. APPROVE if sufficiently original\n"
                "4. Score creativity from 1 to 100\n\n"
                "Reply ONLY valid JSON, no markdown:\n"
                "{\"approved\":true,\"reason\":\"short reason\",\"creativity_score\":75}"
            )
            raw = gl.nondet.exec_prompt(prompt)
            raw = raw.replace("```json", "").replace("```", "").strip()
            return json.dumps(json.loads(raw), sort_keys=True)

        result_str = gl.eq_principle.prompt_comparative(
            judge_originality,
            "The approved boolean field must be identical"
        )
        result = json.loads(result_str)

        approved   = bool(result.get("approved", False))
        reason     = str(result.get("reason", ""))[:200]
        creativity = max(1, min(100, int(result.get("creativity_score", 50))))

        self.platform_balance = self.platform_balance + paid

        if not approved:
            return json.dumps({"success": False, "reason": reason})

        cert_id = self.work_count

        rec = gl.storage.inmem_allocate(
            IPRecord,
            cert_id,
            creator,
            title,
            description,
            media_type,
            source_url,
            u256(creativity),
            license_fee,
            u256(0),
            True,
        )
        self.works.append(rec)
        self.work_count = self.work_count + u256(1)

        return json.dumps({
            "success":          True,
            "cert_id":          int(cert_id),
            "title":            title,
            "creativity_score": creativity,
            "reason":           reason,
        })

    @gl.public.write.payable
    def file_dispute(self, cert_id: u256, suspect_url: str) -> str:
        claimant = gl.message.sender_address
        bond     = gl.message.value
        cid      = int(cert_id)

        assert bond >= self.dispute_bond, "Bond 0.05 GEN required"
        assert cid < int(self.work_count), "Certificate not found"
        ip = self.works[cid]
        assert ip.is_active, "IP record is not active"
        assert len(suspect_url.strip()) >= 8, "Suspect URL required"

        orig_title = str(ip.title)
        orig_desc  = str(ip.description)
        target_url = suspect_url

        def judge_infringement() -> str:
            try:
                html = gl.nondet.web.get(target_url).body.decode("utf-8")
                snippet = html[:2000] if html else "(empty)"
            except Exception:
                snippet = "(unreachable)"

            prompt = (
                "You are an IP infringement judge on a blockchain.\n\n"
                "Original registered work:\n"
                "- Title: " + orig_title + "\n"
                "- Description: " + orig_desc + "\n\n"
                "Suspected infringing content at: " + target_url + "\n"
                "Page content preview:\n" + snippet + "\n\n"
                "Verdict rules:\n"
                "- \"infringement\": page clearly reproduces the original creative work\n"
                "- \"clear\": content is unrelated or only superficially similar\n"
                "- \"invalid\": URL unreachable or no relevant content found\n\n"
                "Reply ONLY valid JSON, no markdown:\n"
                "{\"verdict\":\"clear\",\"confidence\":70,\"reason\":\"short reason\"}"
            )
            raw = gl.nondet.exec_prompt(prompt)
            raw = raw.replace("```json", "").replace("```", "").strip()
            return json.dumps(json.loads(raw), sort_keys=True)

        result_str = gl.eq_principle.prompt_comparative(
            judge_infringement,
            "The verdict field must be identical (infringement/clear/invalid)"
        )
        result = json.loads(result_str)

        verdict = str(result.get("verdict", "invalid")).lower()
        if verdict not in ("infringement", "clear", "invalid"):
            verdict = "invalid"
        confidence = max(0, min(100, int(result.get("confidence", 0))))
        reasoning  = str(result.get("reason", ""))[:200]

        did = self.dispute_count

        rec = gl.storage.inmem_allocate(
            DisputeRecord,
            did,
            claimant,
            cert_id,
            suspect_url,
            bond,
            verdict,
            u256(confidence),
            reasoning,
            True,
        )
        self.disputes.append(rec)
        self.dispute_count = self.dispute_count + u256(1)

        if verdict == "infringement":
            platform_cut = self._platform_cut(bond)
            creator_cut  = bond - platform_cut
            self.platform_balance = self.platform_balance + platform_cut
            self.works[cid].total_royalties = ip.total_royalties + creator_cut
            _EOA(ip.creator).emit_transfer(value=creator_cut)
        elif verdict == "clear":
            _EOA(claimant).emit_transfer(value=bond)
        else:
            self.platform_balance = self.platform_balance + bond

        return json.dumps({
            "success":    True,
            "dispute_id": int(did),
            "verdict":    verdict,
            "confidence": confidence,
            "reason":     reasoning,
            "bond_wei":   int(bond),
        })

    @gl.public.write.payable
    def request_license(self, cert_id: u256) -> str:
        licensee = gl.message.sender_address
        paid     = gl.message.value
        cid      = int(cert_id)

        assert cid < int(self.work_count), "Certificate not found"
        ip = self.works[cid]
        assert ip.is_active, "IP record not active"
        assert paid >= ip.license_fee, "License fee not met"

        platform_cut = self._platform_cut(paid)
        creator_cut  = paid - platform_cut

        self.platform_balance = self.platform_balance + platform_cut
        self.works[cid].total_royalties = ip.total_royalties + creator_cut

        _EOA(ip.creator).emit_transfer(value=creator_cut)

        return json.dumps({
            "success":          True,
            "cert_id":          int(cid),
            "licensee":         licensee.as_hex,
            "creator":          ip.creator.as_hex,
            "creator_receives": int(creator_cut),
            "platform_cut":     int(platform_cut),
        })

    @gl.public.write
    def update_license_fee(self, cert_id: u256, new_fee: u256) -> str:
        cid = int(cert_id)
        assert cid < int(self.work_count), "Certificate not found"
        assert gl.message.sender_address == self.works[cid].creator, "Only creator"
        self.works[cid].license_fee = new_fee
        return json.dumps({"success": True, "cert_id": cid, "new_fee": int(new_fee)})

    @gl.public.write
    def revoke_work(self, cert_id: u256) -> str:
        cid = int(cert_id)
        assert cid < int(self.work_count), "Certificate not found"
        caller = gl.message.sender_address
        assert caller == self.works[cid].creator or caller == self.owner, "Only creator or owner"
        self.works[cid].is_active = False
        return json.dumps({"success": True, "revoked": cid})

    @gl.public.write
    def withdraw_fees(self) -> u256:
        assert gl.message.sender_address == self.owner, "Not owner"
        amount = self.platform_balance
        assert amount > u256(0), "Nothing to withdraw"
        self.platform_balance = u256(0)
        _EOA(self.owner).emit_transfer(value=amount)
        return amount

    @gl.public.view
    def get_work(self, cert_id: u256) -> dict:
        cid = int(cert_id)
        if cid >= int(self.work_count):
            return {}
        r = self.works[cid]
        return {
            "cert_id":          int(r.cert_id),
            "creator":          r.creator.as_hex,
            "title":            str(r.title),
            "description":      str(r.description),
            "media_type":       str(r.media_type),
            "source_url":       str(r.source_url),
            "creativity_score": int(r.creativity_score),
            "license_fee_wei":  int(r.license_fee),
            "total_royalties":  int(r.total_royalties),
            "is_active":        bool(r.is_active),
        }

    @gl.public.view
    def get_all_works(self) -> list:
        result = []
        for i in range(int(self.work_count)):
            result.append(self.get_work(u256(i)))
        return result

    @gl.public.view
    def get_creator_works(self, addr: str) -> list:
        target = Address(addr)
        result = []
        for i in range(int(self.work_count)):
            r = self.works[i]
            if r.creator == target:
                result.append(int(r.cert_id))
        return result

    @gl.public.view
    def get_dispute(self, dispute_id: u256) -> dict:
        did = int(dispute_id)
        if did >= int(self.dispute_count):
            return {}
        d = self.disputes[did]
        return {
            "dispute_id":  int(d.dispute_id),
            "claimant":    d.claimant.as_hex,
            "cert_id":     int(d.cert_id),
            "suspect_url": str(d.suspect_url),
            "bond_wei":    int(d.bond),
            "verdict":     str(d.verdict),
            "confidence":  int(d.confidence),
            "reasoning":   str(d.reasoning),
            "resolved":    bool(d.resolved),
        }

    @gl.public.view
    def get_stats(self) -> dict:
        return {
            "total_works":      int(self.work_count),
            "total_disputes":   int(self.dispute_count),
            "reg_fee_wei":      int(self.reg_fee),
            "dispute_bond_wei": int(self.dispute_bond),
            "platform_fee_pct": int(self.platform_bps) / 100,
            "platform_balance": int(self.platform_balance),
            "owner":            self.owner.as_hex,
        }

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner.as_hex
