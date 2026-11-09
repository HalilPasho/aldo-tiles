import {describe,it,expect} from 'vitest';
import {load} from 'cheerio';
import {auditForm} from '../../scripts/lib/audit-rules.mjs';
const delivery={provider:'formsubmit',recipientEmail:'owner@fixture.test',siteUrl:'https://tiles.fixture.test'};
const fields=['bot-field','subject','name','phone','email','city','projectType','service','message'];
const html=`<form name="contact" method="POST" action="https://formsubmit.co/owner@fixture.test">${fields.map(name=>`<input name="${name}" value="Tile enquiry">`).join('')}<input type="hidden" name="_subject" value="Tile enquiry"><input type="hidden" name="_next" value="https://tiles.fixture.test/thank-you/"><input name="_honey" type="text" tabindex="-1"></form>`;
function edited(change:($:ReturnType<typeof load>)=>void){const $=load(html);change($);return $.html();}
describe('Cloudflare-compatible form audit',()=>{
 it('accepts provider delivery without relying on Netlify hosting attributes',()=>{expect(auditForm(html,delivery)).toEqual([])});
 it('rejects delivery to a different email',()=>{expect(auditForm(edited($=>{$('form').attr('action','https://formsubmit.co/stranger@fixture.test')}),delivery)).toEqual([expect.objectContaining({message:expect.stringContaining('business email')})])});
 it.each(['_subject','_next','_honey'])('detects a missing %s delivery field',name=>{expect(auditForm(edited($=>{$(`[name="${name}"]`).remove()}),delivery)).toEqual([expect.objectContaining({message:expect.stringContaining(name)})])});
 it('rejects a return address that leaves this site',()=>{expect(auditForm(edited($=>{$('[name="_next"]').attr('value','https://elsewhere.test/')}),delivery)).toEqual([expect.objectContaining({message:expect.stringContaining('return address')})])});
 it('rejects a notification subject that no longer matches the form',()=>{expect(auditForm(edited($=>{$('[name="_subject"]').attr('value','Different')}),delivery)).toEqual([expect.objectContaining({message:expect.stringContaining('_subject')})])});
 it('keeps the spam trap out of keyboard navigation',()=>{expect(auditForm(edited($=>{$('[name="_honey"]').removeAttr('tabindex')}),delivery)).toEqual([expect.objectContaining({message:expect.stringContaining('spam trap')})])});
 it('rejects unsupported delivery providers',()=>{expect(auditForm(html,{...delivery,provider:'unknown'})).toEqual([expect.objectContaining({message:expect.stringContaining('not supported')})])});
});
