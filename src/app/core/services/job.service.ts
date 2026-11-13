import { Injectable, signal, inject } from '@angular/core';
import { Job, JobStatus, JobBid } from '../models/job.model';
import { WorkerProfile } from '../models/worker.model';
import { SeedDataService } from './seed-data.service';
import { NotificationService } from './notification.service';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private seedData = inject(SeedDataService);
  private notificationService = inject(NotificationService);
  private firebaseService = inject(FirebaseService);

  private jobsSignal = signal<Job[]>([]);
  public jobs = this.jobsSignal.asReadonly();

  // Active incoming job offer for worker alert popup
  public incomingJobOfferSignal = signal<{ job: Job; expiresAt: number } | null>(null);

  constructor() {
    this.loadJobs();
  }

  private loadJobs(): void {
    const saved = localStorage.getItem('kajkhoj_jobs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(j => j.id === 'job_demo_102')) {
          this.jobsSignal.set(parsed);
          return;
        }
      } catch (e) {}
    }
    this.jobsSignal.set(this.seedData.defaultJobs);
    this.saveToStorage();
  }

  public resetSeedJobs(): void {
    this.jobsSignal.set(this.seedData.defaultJobs);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    localStorage.setItem('kajkhoj_jobs', JSON.stringify(this.jobsSignal()));
  }

  public getJobById(jobId: string): Job | undefined {
    return this.jobsSignal().find(j => j.id === jobId);
  }

  public getCustomerJobs(customerId: string): Job[] {
    return this.jobsSignal().filter(j => j.customerId === customerId);
  }

  public getWorkerJobs(workerId: string): Job[] {
    return this.jobsSignal().filter(j => j.workerId === workerId);
  }

  public getOpenBoardJobs(categoryId?: string, areaId?: string): Job[] {
    return this.jobsSignal().filter(j => {
      const isBoard = j.type === 'board_fixed' || j.type === 'board_bid' || j.status === 'searching';
      const matchesCat = !categoryId || j.categoryId === categoryId;
      const matchesArea = !areaId || j.areaId === areaId;
      return isBoard && matchesCat && matchesArea && !j.workerId;
    });
  }

  public createJob(jobData: Partial<Job>): Job {
    const startOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const newJob: Job = {
      id: `job_${Date.now()}`,
      customerId: jobData.customerId || 'user_customer_demo_1',
      customerName: jobData.customerName || 'তানভীর আহমেদ',
      customerPhone: jobData.customerPhone || '01712345678',
      categoryId: jobData.categoryId || 'plumber',
      categoryName: jobData.categoryName || 'প্লাম্বার',
      areaId: jobData.areaId || 'savar_bazar',
      type: jobData.type || 'instant',
      description: jobData.description || 'সার্ভিস প্রয়োজন',
      photos: jobData.photos || [],
      location: jobData.location || { lat: 23.8223, lng: 90.2673, address: 'সাভার, ঢাকা' },
      status: jobData.type === 'instant' ? 'searching' : 'pending',
      estimatedPrice: jobData.estimatedPrice || 350,
      paymentMethod: jobData.paymentMethod || 'cash',
      paymentStatus: 'unpaid',
      startOtp,
      searchRadiusKm: 3,
      timeline: {
        createdAt: new Date().toISOString()
      },
      ...jobData
    } as Job;

    this.jobsSignal.update(list => [newJob, ...list]);
    this.saveToStorage();

    // Trigger offer notification
    this.notificationService.addNotification({
      userId: newJob.customerId,
      title: 'নতুন কাজ তৈরি হয়েছে 📋',
      body: `${newJob.categoryName} সেবার জন্য কাজ সফলভাবে পোস্ট করা হয়েছে।`,
      type: 'job_status',
      link: `/customer/tracking/${newJob.id}`
    });

    return newJob;
  }

  // Direct Booking for a specific worker (Item 18)
  public directBookWorker(worker: WorkerProfile, details: Partial<Job>): Job {
    const startOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const newJob: Job = {
      id: `job_${Date.now()}`,
      customerId: details.customerId || 'user_customer_demo_1',
      customerName: details.customerName || 'তানভীর আহমেদ',
      customerPhone: details.customerPhone || '01712345678',
      workerId: worker.uid,
      workerName: worker.name,
      workerPhone: worker.phone,
      workerPhoto: worker.photoURL,
      categoryId: worker.categoryIds[0] || 'plumber',
      categoryName: details.categoryName || 'হোম সার্ভিস',
      areaId: worker.areaId,
      type: 'direct',
      description: details.description || 'সরাসরি কারিগর বুকিং',
      photos: details.photos || [],
      location: details.location || { lat: 23.8223, lng: 90.2673, address: 'সাভার, ঢাকা' },
      status: 'accepted',
      estimatedPrice: worker.rate || 350,
      paymentMethod: details.paymentMethod || 'cash',
      paymentStatus: 'unpaid',
      startOtp,
      timeline: {
        createdAt: new Date().toISOString(),
        acceptedAt: new Date().toISOString()
      },
      ...details
    } as Job;

    this.jobsSignal.update(list => [newJob, ...list]);
    this.saveToStorage();

    // Notify worker
    this.notificationService.addNotification({
      userId: worker.uid,
      title: 'সরাসরি বুকিং এসেছে! ⚡',
      body: `${newJob.customerName} আপনাকে সরাসরি বুক করেছেন (${newJob.categoryName})।`,
      type: 'job_offer',
      link: `/worker/active`
    });

    return newJob;
  }

  public updateJobStatus(jobId: string, status: JobStatus, extra?: Partial<Job>): boolean {
    let updated = false;
    this.jobsSignal.update(list => list.map(j => {
      if (j.id === jobId) {
        updated = true;
        const now = new Date().toISOString();
        const timeline = { ...j.timeline };

        if (status === 'accepted') timeline.acceptedAt = now;
        if (status === 'arrived') timeline.arrivedAt = now;
        if (status === 'in_progress') timeline.startedAt = now;
        if (status === 'completed') timeline.completedAt = now;

        return {
          ...j,
          status,
          timeline,
          ...extra
        };
      }
      return j;
    }));

    if (updated) {
      this.saveToStorage();
      const job = this.getJobById(jobId);
      if (job) {
        this.firebaseService.updateJobTracking(jobId, job.location, 10);
      }
    }
    return updated;
  }

  public acceptJob(jobId: string, workerId: string, workerName: string, workerPhone: string, workerPhoto: string): boolean {
    return this.updateJobStatus(jobId, 'accepted', {
      workerId,
      workerName,
      workerPhone,
      workerPhoto
    });
  }

  /**
   * First-come, first-served job grab mechanism.
   * Ensures race condition safety: If another worker grabbed the job first,
   * subsequent grab attempts are safely rejected.
   */
  public grabJob(
    jobId: string,
    worker: { uid: string; name: string; phone: string; photoURL: string }
  ): { success: boolean; message: string; job?: Job } {
    const job = this.getJobById(jobId);
    if (!job) {
      return { success: false, message: 'কাজের রিকোয়েস্টটি পাওয়া যায়নি।' };
    }

    // Check if another worker already claimed this work request
    if (job.workerId && job.workerId !== worker.uid) {
      return {
        success: false,
        message: `দুঃখিত! এই কাজটি ইতিমধ্যে অন্য একজন কারিগর (${job.workerName || 'অন্য প্লাম্বার'}) গ্রহণ করে ফেলেছেন।`
      };
    }

    // Check status
    if (job.status !== 'searching' && job.status !== 'pending') {
      return {
        success: false,
        message: 'এই কাজের অফারটি ইতিমধ্যে গ্রহণ করা হয়েছে বা মেয়াদ শেষ হয়েছে।'
      };
    }

    const updated = this.updateJobStatus(jobId, 'accepted', {
      workerId: worker.uid,
      workerName: worker.name,
      workerPhone: worker.phone,
      workerPhoto: worker.photoURL
    });

    const updatedJob = this.getJobById(jobId);
    return {
      success: updated,
      message: 'অভিনন্দন! আপনি সফলভাবে কাজটি গ্রহণ (Grab) করেছেন। কাস্টমারের কাছে রওনা দিন।',
      job: updatedJob
    };
  }

  /**
   * Helper to simulate a plumber grabbing an open work request.
   * Useful for live demo and testing first-come first-served fulfillment.
   */
  public simulateWorkerGrab(
    jobId: string,
    workerUid?: string
  ): { success: boolean; message: string; workerName: string; job?: Job } {
    const defaultWorkers = this.seedData.defaultWorkers;
    const targetWorker = workerUid
      ? defaultWorkers.find(w => w.uid === workerUid)
      : defaultWorkers.find(w => w.categoryIds.includes('plumber')) || defaultWorkers[0];

    if (!targetWorker) {
      return { success: false, message: 'কোনো ডেমো কারিগর পাওয়া যায়নি।', workerName: '' };
    }

    const res = this.grabJob(jobId, {
      uid: targetWorker.uid,
      name: targetWorker.name,
      phone: targetWorker.phone,
      photoURL: targetWorker.photoURL
    });

    return {
      success: res.success,
      message: res.message,
      workerName: targetWorker.name,
      job: res.job
    };
  }

  public verifyAndStartJob(jobId: string, inputOtp: string): { success: boolean; message: string } {
    const job = this.getJobById(jobId);
    if (!job) return { success: false, message: 'কাজটি পাওয়া যায়নি।' };
    if (job.startOtp !== inputOtp.trim()) {
      return { success: false, message: 'ভুল OTP! কাস্টমারের ফোন দেখে ৪ সংখ্যার সঠিক কোড দিন।' };
    }

    this.updateJobStatus(jobId, 'in_progress');
    return { success: true, message: 'OTP সফলভাবে যাচাই হয়েছে! কাজ শুরু করা হয়েছে।' };
  }

  public completeJob(
    jobId: string,
    finalPrice: number,
    materialCost: number = 0,
    afterWorkPhoto?: string
  ): void {
    const commissionRate = 0.15;
    const platformFee = 20;
    const commission = Math.round(finalPrice * commissionRate);
    const workerEarning = (finalPrice + materialCost) - commission;

    this.updateJobStatus(jobId, 'completed', {
      finalPrice,
      materialCost,
      commission,
      platformFee,
      workerEarning,
      afterWorkPhoto,
      paymentStatus: 'paid'
    });
  }

  // Submit Bid for Job Board (Item 33)
  public submitBid(jobId: string, bid: Omit<JobBid, 'id' | 'createdAt'>): void {
    const newBid: JobBid = {
      ...bid,
      id: `bid_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    this.jobsSignal.update(list => list.map(j => {
      if (j.id === jobId) {
        const bids = j.bids || [];
        return {
          ...j,
          bids: [...bids.filter(b => b.workerId !== bid.workerId), newBid]
        };
      }
      return j;
    }));
    this.saveToStorage();

    this.notificationService.addNotification({
      userId: 'customer',
      title: 'নতুন কোটেশন / বিড জমা পড়েছে 💰',
      body: `${bid.workerName} আপনার কাজের জন্য ৳${bid.amount} কোটেশন দিয়েছেন।`,
      type: 'job_status',
      link: `/customer/tracking/${jobId}`
    });
  }

  // Customer chooses a Bid (Item 33)
  public chooseBid(jobId: string, bidId: string): void {
    const job = this.getJobById(jobId);
    if (!job || !job.bids) return;

    const bid = job.bids.find(b => b.id === bidId);
    if (!bid) return;

    this.updateJobStatus(jobId, 'accepted', {
      workerId: bid.workerId,
      workerName: bid.workerName,
      workerPhoto: bid.workerPhoto,
      estimatedPrice: bid.amount,
      finalPrice: bid.amount
    });

    this.notificationService.addNotification({
      userId: bid.workerId,
      title: 'আপনার বিড অনুমোদিত হয়েছে! 🎉',
      body: `গ্রাহক আপনার ৳${bid.amount} টাকার কোটেশন গ্রহণ করেছেন। কাজ শুরু করুন।`,
      type: 'job_offer',
      link: `/worker/active`
    });
  }

  // Renegotiate quote (Item 21)
  public submitRenegotiation(jobId: string, newPrice: number): void {
    this.jobsSignal.update(list => list.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          renegotiatedPrice: newPrice,
          renegotiationStatus: 'pending'
        };
      }
      return j;
    }));
    this.saveToStorage();

    const job = this.getJobById(jobId);
    if (job) {
      this.notificationService.addNotification({
        userId: job.customerId,
        title: 'মূল্য পুনর্নির্ধারণ প্রস্তাব 💵',
        body: `কারিগর কাজের জন্য নতুন মূল্য ৳${newPrice} প্রস্তাব করেছেন। অনুগ্রহ করে অনুমোদন করুন।`,
        type: 'job_status',
        link: `/customer/tracking/${jobId}`
      });
    }
  }

  public respondToRenegotiation(jobId: string, accept: boolean): void {
    this.jobsSignal.update(list => list.map(j => {
      if (j.id === jobId) {
        if (accept && j.renegotiatedPrice) {
          return {
            ...j,
            finalPrice: j.renegotiatedPrice,
            renegotiationStatus: 'accepted'
          };
        } else {
          return {
            ...j,
            renegotiationStatus: 'rejected'
          };
        }
      }
      return j;
    }));
    this.saveToStorage();
  }

  // Material cost approval with photo (Item 22)
  public submitMaterialCost(jobId: string, cost: number, receiptPhoto?: string): void {
    this.jobsSignal.update(list => list.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          materialCost: cost,
          materialReceiptPhoto: receiptPhoto,
          materialApprovalStatus: 'pending'
        };
      }
      return j;
    }));
    this.saveToStorage();

    const job = this.getJobById(jobId);
    if (job) {
      this.notificationService.addNotification({
        userId: job.customerId,
        title: 'মালামাল ক্রয়ের রসিদ ও খরচ 🧾',
        body: `কারিগর মালামাল বাবদ ৳${cost} রসিদ আপলোড করেছেন। অনুমোদন করুন।`,
        type: 'job_status',
        link: `/customer/tracking/${jobId}`
      });
    }
  }

  public respondToMaterialCost(jobId: string, accept: boolean): void {
    this.jobsSignal.update(list => list.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          materialApprovalStatus: accept ? 'accepted' : 'rejected'
        };
      }
      return j;
    }));
    this.saveToStorage();
  }

  // Before & After work photos (Item 34)
  public uploadJobPhoto(jobId: string, type: 'before' | 'after', photoUrl: string): void {
    this.jobsSignal.update(list => list.map(j => {
      if (j.id === jobId) {
        if (type === 'before') {
          return { ...j, beforeWorkPhoto: photoUrl };
        } else {
          return { ...j, afterWorkPhoto: photoUrl };
        }
      }
      return j;
    }));
    this.saveToStorage();
  }

  // Cancel Job with Fee Policy (Item 56)
  public cancelJob(
    jobId: string,
    cancelledByOrReason: string,
    reasonOrIsWorker?: string | boolean
  ): { feeApplied: number } {
    const job = this.getJobById(jobId);
    let feeApplied = 0;

    let isWorker = false;
    let reason = '';
    let cancelledBy = 'customer';

    if (cancelledByOrReason === 'worker' || cancelledByOrReason === 'customer') {
      cancelledBy = cancelledByOrReason;
      isWorker = cancelledBy === 'worker';
      reason = typeof reasonOrIsWorker === 'string' ? reasonOrIsWorker : 'বাতিল করা হয়েছে';
    } else {
      reason = cancelledByOrReason;
      isWorker = !!reasonOrIsWorker;
      cancelledBy = isWorker ? 'worker' : 'customer';
    }

    if (job) {
      const now = Date.now();
      const createdTime = new Date(job.timeline.createdAt).getTime();
      const elapsedMinutes = (now - createdTime) / (1000 * 60);

      // Free within 2 minutes; ৳50 fee if cancelled after worker dispatched / accepted
      if (!isWorker && job.status !== 'searching' && job.status !== 'pending' && elapsedMinutes > 2) {
        feeApplied = 50;
      }

      this.updateJobStatus(
        jobId,
        isWorker ? 'cancelled_by_worker' : 'cancelled_by_customer',
        {
          cancelReason: reason,
          cancelledBy,
          cancellationFee: feeApplied
        }
      );
    }

    return { feeApplied };
  }

  public triggerIncomingOfferForWorker(job: Job): void {
    this.incomingJobOfferSignal.set({
      job,
      expiresAt: Date.now() + 30000
    });
  }

  public clearIncomingOffer(): void {
    this.incomingJobOfferSignal.set(null);
  }
}
